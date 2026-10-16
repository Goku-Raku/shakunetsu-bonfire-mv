# Offline checks. This never reads the real token or contacts NovelAI.
$ErrorActionPreference = 'Stop'
$module = Import-Module (Join-Path $PSScriptRoot 'NovelAI.Core.psm1') -Force -PassThru
$root = Join-Path $PSScriptRoot ('.test-private\' + [Guid]::NewGuid().ToString('N'))
$checks = [Collections.Generic.List[string]]::new()
function Assert-Local([bool]$Condition, [string]$Description) {
    if (-not $Condition) { throw "FAIL: $Description" }
    $checks.Add($Description)
}
try {
    & $module {
        param($path)
        $script:CredentialDirectory = Join-Path $path 'credentials'
        $script:CredentialPath = Join-Path $script:CredentialDirectory 'token.dpapi'
    } $root
    Assert-Local (-not (Get-NAIStatus).token_saved) 'isolated test credential store'
    $dummy = 'test-only-not-a-real-token-123456789'
    $secure = ConvertTo-SecureString $dummy -AsPlainText -Force
    Set-NAIToken -Token $secure
    $secure.Dispose()
    $status = Get-NAIStatus
    Assert-Local $status.token_saved 'encrypted credential written'
    $raw = [IO.File]::ReadAllBytes($status.credential_path)
    Assert-Local (-not [Text.Encoding]::UTF8.GetString($raw).Contains($dummy)) 'credential file contains no plaintext token'
    $roundtrip = & $module { Get-NAITokenInternal }
    Assert-Local ($roundtrip -ceq $dummy) 'DPAPI round trip under current user'
    $acl = Get-Acl -LiteralPath (Split-Path $status.credential_path)
    Assert-Local ($acl.AreAccessRulesProtected -and @($acl.Access).Count -eq 2) 'private directory has restricted ACL'
    $secure = ConvertTo-SecureString ($dummy + '-replacement') -AsPlainText -Force
    Set-NAIToken -Token $secure
    $secure.Dispose()
    Assert-Local ([IO.File]::Exists((Join-Path (Split-Path $status.credential_path) 'token.previous.dpapi'))) 'replacement keeps encrypted previous token'
    Assert-Local ((& $module { Get-NAITokenInternal }) -ceq ($dummy + '-replacement')) 'replacement is readable'
    $example = Join-Path $PSScriptRoot 'request.example.json'
    $preview = Invoke-NAIGeneration -RequestFile $example -OutputDirectory (Join-Path $root 'output')
    Assert-Local (-not $preview.execute -and $preview.images -eq 1) 'generation defaults to preview without network'
    $invalid = Read-NAIRequest -RequestFile $example
    $invalid.parameters.n_samples = 2
    $badFile = Join-Path $root 'invalid.json'
    [IO.File]::WriteAllText($badFile, ($invalid | ConvertTo-Json -Depth 30))
    $rejected = $false
    try { Read-NAIRequest -RequestFile $badFile | Out-Null } catch { $rejected = $true }
    Assert-Local $rejected 'multiple-image request rejected before network'
    $invalid.parameters.n_samples = 1
    $invalid.parameters | Add-Member image_format 'webp'
    [IO.File]::WriteAllText($badFile, ($invalid | ConvertTo-Json -Depth 30))
    $rejected = $false
    try { Read-NAIRequest -RequestFile $badFile | Out-Null } catch { $rejected = $true }
    Assert-Local $rejected 'unsupported image format rejected before network'
    # Replace network implementation inside this isolated module instance.
    & $module {
        function script:Invoke-NAIJsonInternal {
            param($Operation, $Body)
            if ($Operation -eq 'Subscription') {
                return [pscustomobject]@{ active=$true; tier=3; trainingStepsLeft=[pscustomobject]@{fixedTrainingStepsLeft=100; purchasedTrainingSteps=0} }
            }
            Add-Type -AssemblyName System.Drawing
            $request = $Body | ConvertFrom-Json
            $bitmap = [Drawing.Bitmap]::new($request.parameters.width, $request.parameters.height)
            $memory = [IO.MemoryStream]::new()
            try {
                $bitmap.Save($memory, [Drawing.Imaging.ImageFormat]::Png)
                return [pscustomobject]@{images=@([pscustomobject]@{image=[Convert]::ToBase64String($memory.ToArray());seed=$request.parameters.seed;index=0})}
            } finally { $bitmap.Dispose(); $memory.Dispose() }
        }
    }
    $connection = Test-NAIConnection
    Assert-Local ($connection.connected -and $connection.fixed_training_steps_left -eq 100) 'subscription fields parsed from mock response'
    $result = Invoke-NAIGeneration -RequestFile $example -OutputDirectory (Join-Path $root 'output') -Execute
    Assert-Local ([IO.File]::Exists($result.image_path)) 'mock JSON response produces validated PNG and request record'
    [pscustomobject]@{ passed=$checks.Count; checks=$checks; live_api_tested=$false } | ConvertTo-Json -Depth 5
} finally {
    $dummy = $null
    $roundtrip = $null
    Remove-Module $module -Force
    $resolvedRoot = [IO.Path]::GetFullPath($root)
    $allowedRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '.test-private')) + [IO.Path]::DirectorySeparatorChar
    if ($resolvedRoot.StartsWith($allowedRoot, [StringComparison]::OrdinalIgnoreCase) -and [IO.Directory]::Exists($resolvedRoot)) {
        Remove-Item -LiteralPath $resolvedRoot -Recurse -Force
    }
}
