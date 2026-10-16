# Entirely offline: no credentials are read and the network function is replaced before use.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$module = Import-Module (Join-Path $PSScriptRoot 'NovelAI.Core.psm1') -Force -PassThru
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$allowedRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot 'outputs/novelai-img2img-tests'))
$root = Join-Path $allowedRoot ([Guid]::NewGuid().ToString('N'))
[IO.Directory]::CreateDirectory($root) | Out-Null
$checks = [Collections.Generic.List[string]]::new()
$utf8 = [Text.UTF8Encoding]::new($false)
$exampleText = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'request.example.json'), $utf8)
$requestPath = Join-Path $root 'request.json'
function Assert-Local([bool]$Condition, [string]$Description) {
    if (-not $Condition) { throw "FAIL: $Description" }
    $checks.Add($Description)
}
function New-TestRequest {
    $request = $exampleText | ConvertFrom-Json
    $request.action = 'img2img'
    $request.parameters.width = 64
    $request.parameters.height = 64
    $request | Add-Member -NotePropertyName image_file -NotePropertyValue 'source.png'
    $request.parameters | Add-Member -NotePropertyName strength -NotePropertyValue 0.35
    $request.parameters | Add-Member -NotePropertyName noise -NotePropertyValue 0.05
    $request.parameters | Add-Member -NotePropertyName extra_noise_seed -NotePropertyValue 4294967295
    return $request
}
function Write-TestRequest($Request) {
    [IO.File]::WriteAllText($requestPath, ($Request | ConvertTo-Json -Depth 50), $utf8)
}
function Assert-Rejected([scriptblock]$Change, [string]$Expected, [string]$Description) {
    $request = New-TestRequest
    & $Change $request
    Write-TestRequest $request
    $rejected = $false
    try { Read-NAIRequest -RequestFile $requestPath | Out-Null }
    catch { $rejected = $_.Exception.Message.Contains($Expected) }
    Assert-Local $rejected $Description
}
try {
    Add-Type -AssemblyName System.Drawing
    $bitmap = [Drawing.Bitmap]::new(64, 64)
    try { $bitmap.Save((Join-Path $root 'source.png'), [Drawing.Imaging.ImageFormat]::Png) }
    finally { $bitmap.Dispose() }
    $pngBytes = [IO.File]::ReadAllBytes((Join-Path $root 'source.png'))
    $pngBase64 = [Convert]::ToBase64String($pngBytes)
    & $module {
        param($Encoded)
        $script:MockImage = $Encoded
        $script:MockCalls = 0
        $script:MockFailure = $false
        function script:Get-NAITokenInternal { throw 'Tests must never read credentials.' }
        function script:Invoke-NAIJsonInternal {
            param($Operation, $Body)
            $script:MockCalls++
            if ($script:MockFailure) { throw 'Simulated uncertain network failure. No retry was made.' }
            if ($Operation -ne 'Generate') { throw 'Unexpected operation in offline test.' }
            return [pscustomobject]@{ images = @([pscustomobject]@{ image = $script:MockImage }) }
        }
    } $pngBase64

    Write-TestRequest (New-TestRequest)
    $source = $null
    $request = Read-NAIRequest -RequestFile $requestPath -ImageSource ([ref]$source)
    Assert-Local ($request.action -eq 'img2img' -and $request.parameters.image -ceq $pngBase64) 'relative local PNG becomes API base64'
    Assert-Local ($null -eq $request.PSObject.Properties['image_file']) 'local-only image_file is removed from API request'
    Assert-Local ($source -ceq (Join-Path $root 'source.png')) 'source metadata uses resolved local path'
    $preview = Invoke-NAIGeneration -RequestFile $requestPath -OutputDirectory (Join-Path $root 'preview-output')
    Assert-Local ($preview.action -eq 'img2img' -and $preview.strength -eq 0.35 -and $preview.noise -eq 0.05) 'preview shows img2img parameters'
    Assert-Local (-not ($preview | ConvertTo-Json).Contains($pngBase64)) 'preview never exposes source base64'
    Assert-Local ((& $module { $script:MockCalls }) -eq 0 -and -not [IO.Directory]::Exists((Join-Path $root 'preview-output'))) 'preview makes no network call or output directory'

    $request = New-TestRequest
    $request.image_file = Join-Path $root 'source.png'
    Write-TestRequest $request
    Assert-Local ((Read-NAIRequest -RequestFile $requestPath).parameters.image -ceq $pngBase64) 'absolute local PNG path works'
    Assert-Rejected { param($r) $r.image_file = 'missing.png' } 'does not exist' 'missing source rejected'
    Assert-Rejected { param($r) $r.image_file = '\\server\share\source.png' } 'local PNG' 'network source path rejected'
    Assert-Rejected { param($r) $r.image_file = 'source.jpg' } 'local PNG' 'non-PNG path rejected'
    Assert-Rejected { param($r) $r.parameters.strength = 1.01 } 'strength must' 'strength above one rejected'
    Assert-Rejected { param($r) $r.parameters.strength = -0.01 } 'strength must' 'negative strength rejected'
    Assert-Rejected { param($r) $r.parameters.strength = '0.35' } 'strength must' 'string strength rejected'
    Assert-Rejected { param($r) $r.parameters.noise = $true } 'noise must' 'boolean noise rejected'
    Assert-Rejected { param($r) $r.parameters.noise = 1.1 } 'noise must' 'noise above one rejected'
    Assert-Rejected { param($r) $r.parameters.extra_noise_seed = 4294967296 } 'extra_noise_seed must' 'extra noise seed above uint32 rejected'
    Assert-Rejected { param($r) $r.parameters.extra_noise_seed = 1.5 } 'extra_noise_seed must' 'fractional extra noise seed rejected'
    Assert-Rejected { param($r) $r.parameters.width = 128 } 'dimensions must exactly match' 'source dimensions mismatch rejected'
    Assert-Rejected { param($r) $r.parameters.n_samples = 2 } 'Exactly one' 'single-image guard preserved'
    Assert-Rejected { param($r) $r.parameters.steps = 51 } 'steps must' 'step limit preserved'
    Assert-Rejected { param($r) $r.parameters.width = 65 } 'multiple of 64' 'dimension multiple guard preserved'
    Assert-Rejected { param($r) $r.parameters.width = 2048; $r.parameters.height = 2048 } '3 megapixels' 'image area limit preserved'
    Assert-Rejected { param($r) $r.model = 'unknown-model' } 'Unsupported model' 'model allowlist preserved'
    Assert-Rejected { param($r) $r.parameters.v4_prompt.caption.base_caption = 'mismatch' } 'must match input' 'V4 positive caption mismatch rejected'
    Assert-Rejected { param($r) $r.parameters.v4_negative_prompt.caption.base_caption = 'mismatch' } 'must match negative_prompt' 'V4 negative caption mismatch rejected'
    Assert-Rejected { param($r) $r.parameters | Add-Member -NotePropertyName image -NotePropertyValue 'abc' } 'not both' 'ambiguous local and embedded sources rejected'
    Assert-Rejected { param($r) $r.PSObject.Properties.Remove('image_file') } 'requires image_file' 'missing img2img source rejected'
    Assert-Rejected { param($r) $r.PSObject.Properties.Remove('image_file'); $r.parameters | Add-Member -NotePropertyName image -NotePropertyValue '!!!' } 'valid PNG base64' 'invalid base64 rejected'
    Assert-Rejected { param($r) $r.action = 'infill' } 'generate or img2img' 'unsupported action rejected'
    Assert-Rejected { param($r) $r.action = 'generate' } 'Source images require' 'generate cannot silently accept source image'
    [IO.File]::WriteAllText((Join-Path $root 'invalid.png'), 'not a png', $utf8)
    Assert-Rejected { param($r) $r.image_file = 'invalid.png' } 'Source PNG must' 'invalid PNG bytes rejected'
    $fakePng = New-Object byte[] 40
    [Array]::Copy($pngBytes, $fakePng, 24)
    [IO.File]::WriteAllBytes((Join-Path $root 'undecodable.png'), $fakePng)
    Assert-Rejected { param($r) $r.image_file = 'undecodable.png' } 'could not be decoded' 'PNG signature alone does not bypass decoder validation'
    $large = [IO.File]::Create((Join-Path $root 'oversized.png'))
    try { $large.SetLength(16777217) } finally { $large.Dispose() }
    Assert-Rejected { param($r) $r.image_file = 'oversized.png' } '16 MB' 'source file size limit enforced before reading'

    $request = New-TestRequest
    $request.parameters.strength = 0
    $request.parameters.noise = 1
    $request.parameters.extra_noise_seed = 0
    Write-TestRequest $request
    Assert-Local ((Read-NAIRequest -RequestFile $requestPath).parameters.strength -eq 0) 'numeric boundary values accepted'
    Write-TestRequest (New-TestRequest)
    $result = Invoke-NAIGeneration -RequestFile $requestPath -OutputDirectory (Join-Path $root 'mock-output') -Execute
    Assert-Local ((& $module { $script:MockCalls }) -eq 1 -and [IO.File]::Exists($result.image_path)) 'mock img2img execution makes one call and saves PNG'
    $saved = Read-NAIRequest -RequestFile $result.request_path
    Assert-Local ($saved.parameters.image -ceq $pngBase64 -and $saved.parameters.strength -eq 0.35) 'saved request retains reproducible source, seed and settings'
    $replayPreview = Invoke-NAIGeneration -RequestFile $result.request_path -OutputDirectory (Join-Path $root 'mock-output')
    Assert-Local ($replayPreview.source_image -ceq 'embedded PNG in request') 'saved request can be previewed without original local source path'

    # A noisy PNG creates a real embedded-image request above the former 1 MB ceiling.
    $largeBitmap = [Drawing.Bitmap]::new(512, 512)
    $pixelData = New-Object byte[] (512 * 512 * 4)
    ([Random]::new(17)).NextBytes($pixelData)
    $locked = $null
    try {
        $locked = $largeBitmap.LockBits([Drawing.Rectangle]::new(0, 0, 512, 512), [Drawing.Imaging.ImageLockMode]::WriteOnly, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
        [Runtime.InteropServices.Marshal]::Copy($pixelData, 0, $locked.Scan0, $pixelData.Length)
        $largeBitmap.UnlockBits($locked)
        $locked = $null
        $largeBitmap.Save((Join-Path $root 'large-source.png'), [Drawing.Imaging.ImageFormat]::Png)
    } finally {
        if ($locked) { $largeBitmap.UnlockBits($locked) }
        $largeBitmap.Dispose()
    }
    $largeImageRequest = New-TestRequest
    $largeImageRequest.parameters.width = 512
    $largeImageRequest.parameters.height = 512
    $largeImageRequest.PSObject.Properties.Remove('image_file')
    $largeImageRequest.parameters | Add-Member -NotePropertyName image -NotePropertyValue ([Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $root 'large-source.png'))))
    Write-TestRequest $largeImageRequest
    Assert-Local ((Get-Item -LiteralPath $requestPath).Length -gt 1048576 -and (Read-NAIRequest -RequestFile $requestPath).parameters.width -eq 512) 'embedded PNG requests above the old 1 MB ceiling replay successfully'

    $generate = $exampleText | ConvertFrom-Json
    $generate.parameters.width = 64
    $generate.parameters.height = 64
    Write-TestRequest $generate
    $generateResult = Invoke-NAIGeneration -RequestFile $requestPath -OutputDirectory (Join-Path $root 'mock-output') -Execute
    Assert-Local ($generateResult.action -eq 'generate' -and [IO.File]::Exists($generateResult.image_path) -and (& $module { $script:MockCalls }) -eq 2) 'text-to-image regression still saves validated PNG and request'
    & $module { $script:MockFailure = $true }
    $failed = $false
    try { Invoke-NAIGeneration -RequestFile $requestPath -OutputDirectory (Join-Path $root 'mock-output') -Execute | Out-Null }
    catch { $failed = $_.Exception.Message.Contains('Simulated uncertain') }
    Assert-Local ($failed -and (& $module { $script:MockCalls }) -eq 3) 'uncertain failure is never retried automatically'
    $largeRequest = [IO.File]::Create($requestPath)
    try { $largeRequest.SetLength(33554433) } finally { $largeRequest.Dispose() }
    $rejected = $false
    try { Read-NAIRequest -RequestFile $requestPath | Out-Null }
    catch { $rejected = $_.Exception.Message.Contains('32 MB') }
    Assert-Local $rejected '32 MB request size limit enforced before parsing'
    [pscustomobject]@{ passed = $checks.Count; checks = $checks; live_api_tested = $false; credentials_read = $false } | ConvertTo-Json -Depth 5
} finally {
    Remove-Module $module -Force
    $resolved = [IO.Path]::GetFullPath($root)
    $prefix = $allowedRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if ($resolved.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase) -and [IO.Directory]::Exists($resolved)) {
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}
