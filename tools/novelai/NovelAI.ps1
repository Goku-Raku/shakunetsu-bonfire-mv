[CmdletBinding()]
param(
    [ValidateSet('Status','Check','Generate')][string]$Action = 'Status',
    [string]$RequestFile,
    [string]$OutputDirectory,
    [switch]$Execute
)
$ErrorActionPreference = 'Stop'
# This command runs in its own process. Keep module discovery in this runtime.
$env:PSModulePath = [IO.Path]::Combine($PSHOME, 'Modules')
try {
    if (-not $RequestFile) { $RequestFile = Join-Path $PSScriptRoot 'request.example.json' }
    if (-not $OutputDirectory) { $OutputDirectory = Join-Path $PSScriptRoot '..\..\source\novelai' }
    Import-Module (Join-Path $PSScriptRoot 'NovelAI.Core.psm1') -Force
    $result = switch ($Action) {
        'Status' { Get-NAIStatus }
        'Check' { Test-NAIConnection }
        'Generate' { Invoke-NAIGeneration -RequestFile $RequestFile -OutputDirectory $OutputDirectory -Execute:$Execute }
    }
    $result | ConvertTo-Json -Depth 10
} catch {
    # Only curated error messages are emitted by the API code, never raw responses.
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
}
