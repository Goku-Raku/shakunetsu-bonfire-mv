Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
# Start-Process from PowerShell 7 can pass its module search paths to Windows
# PowerShell 5.1. Load this runtime's own built-ins by absolute manifest path.
# This changes only this process; no global module paths or settings are edited.
foreach ($runtimeModule in @('Microsoft.PowerShell.Utility', 'Microsoft.PowerShell.Management', 'Microsoft.PowerShell.Security')) {
    $manifest = [IO.Path]::Combine($PSHOME, 'Modules', $runtimeModule, ($runtimeModule + '.psd1'))
    Import-Module -Name $manifest -Global -ErrorAction Stop
}
Add-Type -AssemblyName System.Security
Add-Type -AssemblyName System.Net.Http

$script:CredentialDirectory = Join-Path $PSScriptRoot '.private'
$script:CredentialPath = Join-Path $script:CredentialDirectory 'token.dpapi'
$script:Entropy = [Text.Encoding]::UTF8.GetBytes('bonfire-mv/novelai/token/v1')
$script:Utf8 = New-Object Text.UTF8Encoding($false)

function Get-NAIStatus {
    [pscustomobject]@{
        token_saved = [IO.File]::Exists($script:CredentialPath)
        credential_path = $script:CredentialPath
        protection = 'Windows DPAPI / CurrentUser'
    }
}

function Initialize-NAIPrivateDirectory {
    [IO.Directory]::CreateDirectory($script:CredentialDirectory) | Out-Null
    if ((Get-Item -LiteralPath $script:CredentialDirectory -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw 'The credential directory must not be a link.'
    }
    $acl = New-Object Security.AccessControl.DirectorySecurity
    $acl.SetAccessRuleProtection($true, $false)
    $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $acl.SetOwner($sid)
    foreach ($identity in @($sid, (New-Object Security.Principal.SecurityIdentifier('S-1-5-18')))) {
        $rule = New-Object Security.AccessControl.FileSystemAccessRule(
            $identity, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
        $acl.AddAccessRule($rule)
    }
    $directory = [IO.DirectoryInfo]::new($script:CredentialDirectory)
    if ($null -ne $directory.PSObject.Methods['SetAccessControl']) {
        $directory.SetAccessControl($acl)
    } else {
        [IO.FileSystemAclExtensions]::SetAccessControl($directory, $acl)
    }
}

function Set-NAIToken {
    [CmdletBinding()]
    param([Parameter(Mandatory)][Security.SecureString]$Token)
    $ptr = [IntPtr]::Zero
    $bytes = $null
    $tempPath = $null
    try {
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token)
        $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr).Trim()
        if ($plain.Length -lt 20 -or $plain.Length -gt 8192 -or $plain -match '[^\x21-\x7e]') {
            throw 'Paste only the full API token, without spaces, quotes, or a Bearer prefix.'
        }
        $bytes = $script:Utf8.GetBytes($plain)
        $cipher = [Security.Cryptography.ProtectedData]::Protect(
            $bytes, $script:Entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
        Initialize-NAIPrivateDirectory
        $tempPath = Join-Path $script:CredentialDirectory ([Guid]::NewGuid().ToString('N') + '.tmp')
        [IO.File]::WriteAllBytes($tempPath, $cipher)
        if ([IO.File]::Exists($script:CredentialPath)) {
            if ((Get-Item -LiteralPath $script:CredentialPath -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
                throw 'The credential file must not be a link.'
            }
            [IO.File]::Replace($tempPath, $script:CredentialPath, (Join-Path $script:CredentialDirectory 'token.previous.dpapi'))
        } else {
            [IO.File]::Move($tempPath, $script:CredentialPath)
        }
    } finally {
        $plain = $null
        if ($bytes) { [Array]::Clear($bytes, 0, $bytes.Length) }
        if ($ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
        if ($tempPath -and [IO.File]::Exists($tempPath)) { [IO.File]::Delete($tempPath) }
    }
}

function Get-NAITokenInternal {
    if (-not [IO.File]::Exists($script:CredentialPath)) {
        throw 'Token not configured. Open Configure-NovelAI.ps1 with Windows PowerShell first.'
    }
    $bytes = $null
    try {
        $bytes = [Security.Cryptography.ProtectedData]::Unprotect(
            [IO.File]::ReadAllBytes($script:CredentialPath), $script:Entropy,
            [Security.Cryptography.DataProtectionScope]::CurrentUser)
        return $script:Utf8.GetString($bytes)
    } catch {
        throw 'Cannot decrypt the saved token. Use the original Windows account or save a new token.'
    } finally {
        if ($bytes) { [Array]::Clear($bytes, 0, $bytes.Length) }
    }
}

function Invoke-NAIJsonInternal {
    param(
        [Parameter(Mandatory)][ValidateSet('Subscription', 'Generate')][string]$Operation,
        [string]$Body
    )
    # Fixed destinations prevent a request file from changing where credentials are sent.
    $url = 'https://image.novelai.net/user/subscription'
    $method = [Net.Http.HttpMethod]::Get
    if ($Operation -eq 'Generate') {
        $url = 'https://image.novelai.net/ai/generate-image'
        $method = [Net.Http.HttpMethod]::Post
    }
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $handler = New-Object Net.Http.HttpClientHandler
    $handler.AllowAutoRedirect = $false
    $client = New-Object Net.Http.HttpClient($handler)
    $client.Timeout = [TimeSpan]::FromSeconds(180)
    $client.MaxResponseContentBufferSize = 67108864
    $message = New-Object Net.Http.HttpRequestMessage($method, $url)
    $response = $null
    try {
        $token = Get-NAITokenInternal
        $message.Headers.Authorization = New-Object Net.Http.Headers.AuthenticationHeaderValue('Bearer', $token)
        $token = $null
        $message.Headers.Accept.ParseAdd('application/json')
        $message.Headers.UserAgent.ParseAdd('NovelAI-Local/1.2')
        if ($Operation -eq 'Generate') {
            $message.Content = New-Object Net.Http.StringContent($Body, $script:Utf8, 'application/json')
        }
        try {
            $response = $client.SendAsync($message).GetAwaiter().GetResult()
        } catch {
            throw 'Network request failed or timed out. No automatic retry was made. For generation, check NovelAI usage before trying again.'
        }
        $status = [int]$response.StatusCode
        if (-not $response.IsSuccessStatusCode) {
            $reason = switch ($status) {
                400 { 'Request parameters were rejected.' }
                401 { 'Token is invalid or expired. Save a valid Persistent API Token.' }
                402 { 'Insufficient Anlas or generation allowance.' }
                403 { 'The account does not have access to this operation or model.' }
                429 { 'Rate limit reached. No retry was made.' }
                default { 'The service could not complete the request. No retry was made.' }
            }
            throw ('NovelAI HTTP {0}: {1}' -f $status, $reason)
        }
        try {
            $json = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
            return ($json | ConvertFrom-Json)
        } catch {
            throw 'NovelAI returned an unreadable JSON response. No retry was made.'
        }
    } finally {
        $token = $null
        if ($response) { $response.Dispose() }
        $message.Dispose()
        $client.Dispose()
        $handler.Dispose()
    }
}

function Get-NAIPropertyInternal {
    param($Object, [string]$Name)
    if ($null -ne $Object -and $null -ne $Object.PSObject.Properties[$Name]) { return $Object.$Name }
    return $null
}

function Test-NAIConnection {
    $data = Invoke-NAIJsonInternal -Operation Subscription
    $active = Get-NAIPropertyInternal $data 'active'
    $tier = Get-NAIPropertyInternal $data 'tier'
    if ($null -eq $active -or $null -eq $tier) {
        throw 'The subscription response was not recognized. Connection is not verified.'
    }
    $steps = Get-NAIPropertyInternal $data 'trainingStepsLeft'
    [pscustomobject]@{
        connected = $true
        active = $active
        tier = $tier
        training_steps_left = $steps
        fixed_training_steps_left = Get-NAIPropertyInternal $steps 'fixedTrainingStepsLeft'
        purchased_training_steps = Get-NAIPropertyInternal $steps 'purchasedTrainingSteps'
    }
}

function Read-NAIRequest {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$RequestFile,
        [ref]$ImageSource
    )
    if ($null -ne $ImageSource) { $ImageSource.Value = $null }
    if (-not [IO.File]::Exists($RequestFile)) { throw 'The request JSON file does not exist.' }
    if ((Get-Item -LiteralPath $RequestFile).Length -gt 33554432) { throw 'Request JSON exceeds the 32 MB request limit.' }
    try { $request = [IO.File]::ReadAllText($RequestFile, $script:Utf8) | ConvertFrom-Json }
    catch { throw 'The request file is not valid JSON.' }
    $action = Get-NAIPropertyInternal $request 'action'
    if ($action -notin @('generate', 'img2img')) { throw 'This tool supports action=generate or img2img only.' }
    $model = Get-NAIPropertyInternal $request 'model'
    if ($model -notin @('nai-diffusion-3','nai-diffusion-4-curated-preview','nai-diffusion-4-full','nai-diffusion-4-5-curated','nai-diffusion-4-5-full')) {
        throw 'Unsupported model. This version supports NovelAI Anime V3, V4, and V4.5.'
    }
    $prompt = Get-NAIPropertyInternal $request 'input'
    if ($prompt -isnot [string] -or [string]::IsNullOrWhiteSpace($prompt)) { throw 'input must contain a text prompt.' }
    $parameters = Get-NAIPropertyInternal $request 'parameters'
    if ($null -eq $parameters) { throw 'parameters are required.' }
    $format = Get-NAIPropertyInternal $parameters 'image_format'
    if ($null -ne $format -and $format -ne 'png') { throw 'Only PNG output is supported; set image_format to png or omit it.' }
    $stream = Get-NAIPropertyInternal $parameters 'stream'
    if ($null -ne $stream -and $stream -ne $false -and $stream -ne '') { throw 'Streaming output is not supported by this tool.' }
    if ((Get-NAIPropertyInternal $parameters 'add_original_image') -eq $true) { throw 'Additional original images are not supported by this single-image tool.' }
    foreach ($name in @('width','height')) {
        $value = Get-NAIPropertyInternal $parameters $name
        if ($value -isnot [int] -and $value -isnot [long]) { throw "$name must be an integer." }
        if ($value -lt 64 -or $value -gt 2048 -or $value % 64 -ne 0) { throw "$name must be a multiple of 64 between 64 and 2048." }
    }
    if ([long]$parameters.width * [long]$parameters.height -gt 3145728) { throw 'Image area exceeds the tool limit of 3 megapixels.' }
    $samples = Get-NAIPropertyInternal $parameters 'n_samples'
    if (($samples -isnot [int] -and $samples -isnot [long]) -or $samples -ne 1) { throw 'Exactly one image per request is supported: set n_samples to 1.' }
    $steps = Get-NAIPropertyInternal $parameters 'steps'
    if (($steps -isnot [int] -and $steps -isnot [long]) -or $steps -lt 1 -or $steps -gt 50) { throw 'steps must be an integer from 1 to 50.' }
    $seed = Get-NAIPropertyInternal $parameters 'seed'
    if (($seed -isnot [int] -and $seed -isnot [long]) -or $seed -lt 0 -or $seed -gt 4294967295) { throw 'seed must be an integer from 0 to 4294967295.' }
    if ($model -like 'nai-diffusion-4*') {
        $v4 = Get-NAIPropertyInternal $parameters 'v4_prompt'
        $caption = Get-NAIPropertyInternal $v4 'caption'
        $base = Get-NAIPropertyInternal $caption 'base_caption'
        if ($base -cne $prompt) { throw 'For V4/V4.5, v4_prompt.caption.base_caption must match input.' }
        $negative = Get-NAIPropertyInternal $parameters 'negative_prompt'
        $v4Negative = Get-NAIPropertyInternal $parameters 'v4_negative_prompt'
        $negativeCaption = Get-NAIPropertyInternal $v4Negative 'caption'
        $negativeBase = Get-NAIPropertyInternal $negativeCaption 'base_caption'
        if ($negative -isnot [string] -or $negativeBase -cne $negative) {
            throw 'For V4/V4.5, v4_negative_prompt.caption.base_caption must match negative_prompt.'
        }
    }
    $imageFile = Get-NAIPropertyInternal $request 'image_file'
    $encodedImage = Get-NAIPropertyInternal $parameters 'image'
    if ($action -eq 'generate') {
        if ($null -ne $imageFile -or $null -ne $encodedImage) { throw 'Source images require action=img2img.' }
    } else {
        foreach ($name in @('strength', 'noise')) {
            $value = Get-NAIPropertyInternal $parameters $name
            if (($value -isnot [int] -and $value -isnot [long] -and $value -isnot [double] -and $value -isnot [decimal]) -or
                [double]::IsNaN([double]$value) -or [double]::IsInfinity([double]$value) -or $value -lt 0 -or $value -gt 1) {
                throw "$name must be a number from 0 to 1 for img2img."
            }
        }
        $extraSeed = Get-NAIPropertyInternal $parameters 'extra_noise_seed'
        if (($extraSeed -isnot [int] -and $extraSeed -isnot [long]) -or $extraSeed -lt 0 -or $extraSeed -gt 4294967295) {
            throw 'extra_noise_seed must be an integer from 0 to 4294967295 for img2img.'
        }
        $imageBytes = $null
        $sourceDescription = 'embedded PNG in request'
        if ($null -ne $imageFile) {
            if ($imageFile -isnot [string] -or [string]::IsNullOrWhiteSpace($imageFile)) { throw 'image_file must be a local PNG path.' }
            if ($null -ne $encodedImage) { throw 'Use image_file or parameters.image, not both.' }
            try {
                $requestDirectory = [IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($RequestFile))
                if ([IO.Path]::IsPathRooted($imageFile)) {
                    $resolvedImage = [IO.Path]::GetFullPath($imageFile)
                } else {
                    $resolvedImage = [IO.Path]::GetFullPath((Join-Path $requestDirectory $imageFile))
                }
            } catch { throw 'image_file must be a valid local PNG path.' }
            if ($resolvedImage.StartsWith('\\') -or [IO.Path]::GetExtension($resolvedImage) -ine '.png') {
                throw 'image_file must refer to a local PNG file, not a network path.'
            }
            if (-not [IO.File]::Exists($resolvedImage)) { throw 'The source PNG does not exist.' }
            if ((Get-Item -LiteralPath $resolvedImage).Length -gt 16777216) { throw 'Source PNG exceeds the 16 MB image limit.' }
            try { $imageBytes = [IO.File]::ReadAllBytes($resolvedImage) }
            catch { throw 'The source PNG could not be read.' }
            $sourceDescription = $resolvedImage
        } else {
            if ($encodedImage -isnot [string] -or [string]::IsNullOrWhiteSpace($encodedImage)) {
                throw 'img2img requires image_file or a base64 PNG in parameters.image.'
            }
            try { $imageBytes = [Convert]::FromBase64String($encodedImage) }
            catch { throw 'parameters.image must contain valid PNG base64.' }
        }
        if ($imageBytes.Length -lt 24 -or $imageBytes.Length -gt 16777216) { throw 'Source PNG must be valid and no larger than 16 MB.' }
        $signature = @(137,80,78,71,13,10,26,10)
        for ($i = 0; $i -lt 8; $i++) {
            if ($imageBytes[$i] -ne $signature[$i]) { throw 'The source image is not a PNG.' }
        }
        # Reject oversized or mismatched IHDR dimensions before asking the decoder to allocate pixels.
        if ([Text.Encoding]::ASCII.GetString($imageBytes, 12, 4) -cne 'IHDR') { throw 'The source PNG header is invalid.' }
        $pngWidth = [long]$imageBytes[16] * 16777216 + [long]$imageBytes[17] * 65536 + [long]$imageBytes[18] * 256 + $imageBytes[19]
        $pngHeight = [long]$imageBytes[20] * 16777216 + [long]$imageBytes[21] * 65536 + [long]$imageBytes[22] * 256 + $imageBytes[23]
        if ($pngWidth -ne $parameters.width -or $pngHeight -ne $parameters.height) {
            throw 'Source PNG dimensions must exactly match the request width and height.'
        }
        Add-Type -AssemblyName System.Drawing
        $imageStream = [IO.MemoryStream]::new($imageBytes, $false)
        $decoded = $null
        try {
            $decoded = [Drawing.Image]::FromStream($imageStream, $true, $true)
            if ($decoded.Width -ne $parameters.width -or $decoded.Height -ne $parameters.height) { throw 'Unexpected source dimensions.' }
        } catch { throw 'The source PNG could not be decoded or its dimensions did not match.' }
        finally {
            if ($decoded) { $decoded.Dispose() }
            $imageStream.Dispose()
        }
        $parameters | Add-Member -NotePropertyName image -NotePropertyValue ([Convert]::ToBase64String($imageBytes)) -Force
        $request.PSObject.Properties.Remove('image_file')
        if ($null -ne $ImageSource) { $ImageSource.Value = $sourceDescription }
    }
    return $request
}

function Invoke-NAIGeneration {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$RequestFile,
        [Parameter(Mandatory)][string]$OutputDirectory,
        [switch]$Execute
    )
    $imageSource = $null
    $request = Read-NAIRequest -RequestFile $RequestFile -ImageSource ([ref]$imageSource)
    $outputRoot = [IO.Path]::GetFullPath($OutputDirectory)
    $preview = [ordered]@{
        execute = [bool]$Execute
        output_directory = $outputRoot
        action = $request.action
        model = $request.model
        width = $request.parameters.width
        height = $request.parameters.height
        steps = $request.parameters.steps
        seed = $request.parameters.seed
        images = 1
        cost = 'Depends on your NovelAI subscription and parameters; no exact quote is available here.'
    }
    if ($request.action -eq 'img2img') {
        $preview['source_image'] = $imageSource
        $preview['strength'] = $request.parameters.strength
        $preview['noise'] = $request.parameters.noise
        $preview['extra_noise_seed'] = $request.parameters.extra_noise_seed
    }
    if (-not $Execute) { return [pscustomobject]$preview }
    # Create a unique output folder BEFORE sending a potentially billable request.
    $runName = (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N').Substring(0,8)
    $runDirectory = Join-Path $outputRoot $runName
    [IO.Directory]::CreateDirectory($runDirectory) | Out-Null
    $body = $request | ConvertTo-Json -Depth 50
    [IO.File]::WriteAllText((Join-Path $runDirectory 'request.json'), $body, $script:Utf8)
    $result = Invoke-NAIJsonInternal -Operation Generate -Body $body
    $images = @(Get-NAIPropertyInternal $result 'images')
    if ($images.Count -ne 1 -or $null -eq $images[0]) { throw 'NovelAI did not return exactly one image. No retry was made.' }
    $encoded = Get-NAIPropertyInternal $images[0] 'image'
    if ($encoded -isnot [string]) { throw 'Image data was not found in the response. No retry was made.' }
    try { $bytes = [Convert]::FromBase64String($encoded) }
    catch { throw 'Image data was not valid base64. No retry was made.' }
    $signature = @(137,80,78,71,13,10,26,10)
    if ($bytes.Length -lt 24) { throw 'Returned image was incomplete. No retry was made.' }
    for ($i=0; $i -lt 8; $i++) {
        if ($bytes[$i] -ne $signature[$i]) { throw 'Returned image was not a PNG. No retry was made.' }
    }
    $png = Join-Path $runDirectory 'image.png'
    [IO.File]::WriteAllBytes($png, $bytes)
    Add-Type -AssemblyName System.Drawing
    $decoded = $null
    try {
        $decoded = [Drawing.Image]::FromFile($png)
        if ($decoded.Width -ne $request.parameters.width -or $decoded.Height -ne $request.parameters.height) {
            throw 'Unexpected image dimensions.'
        }
    } catch {
        throw 'The received image was saved, but image decoding or dimension checks failed. No retry was made.'
    } finally {
        if ($decoded) { $decoded.Dispose() }
    }
    $preview['image_path'] = $png
    $preview['request_path'] = Join-Path $runDirectory 'request.json'
    $preview['completed_utc'] = [DateTime]::UtcNow.ToString('o')
    [IO.File]::WriteAllText((Join-Path $runDirectory 'result.json'), ($preview | ConvertTo-Json -Depth 8), $script:Utf8)
    return [pscustomobject]$preview
}

Export-ModuleMember -Function Get-NAIStatus, Set-NAIToken, Test-NAIConnection, Read-NAIRequest, Invoke-NAIGeneration
