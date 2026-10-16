# Read-only subscription diagnostics. Never emits headers, tokens, or raw bodies.
$ErrorActionPreference = 'Stop'
$env:PSModulePath = [IO.Path]::Combine($PSHOME, 'Modules')
$core = Import-Module (Join-Path $PSScriptRoot 'NovelAI.Core.psm1') -Force -PassThru
$handler = [Net.Http.HttpClientHandler]::new()
$handler.AllowAutoRedirect = $false
$client = [Net.Http.HttpClient]::new($handler)
$client.Timeout = [TimeSpan]::FromSeconds(30)
$request = [Net.Http.HttpRequestMessage]::new([Net.Http.HttpMethod]::Get, 'https://image.novelai.net/user/subscription')
$response = $null
$token = $null
try {
    $token = & $core { Get-NAITokenInternal }
    $request.Headers.Authorization = [Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $token)
    $request.Headers.Accept.ParseAdd('application/json')
    $request.Headers.UserAgent.ParseAdd('NovelAI-Local/1.2')
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    $report = [ordered]@{
        http_status = [int]$response.StatusCode
        successful = $response.IsSuccessStatusCode
        content_type = [string]$response.Content.Headers.ContentType
    }
    if (-not $response.IsSuccessStatusCode) {
        $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        $report['body_length'] = $body.Length
        try {
            $data = $body | ConvertFrom-Json
            $report['response_format'] = 'json'
            foreach ($name in @('message','error','detail')) {
                if ($data.PSObject.Properties[$name] -and $data.$name -is [string]) {
                    $safe = $data.$name.Replace($token, '[REDACTED]')
                    $safe = [regex]::Replace($safe, '(?i)Bearer\s+\S+', 'Bearer [REDACTED]')
                    $safe = [regex]::Replace($safe, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[EMAIL]')
                    $safe = [regex]::Replace($safe, 'https?://\S+', '[URL]')
                    $safe = [regex]::Replace($safe, '[A-Za-z0-9_+/=.~-]{20,}', '[OPAQUE_VALUE]')
                    $safe = [regex]::Replace($safe, '[\r\n\t]', ' ')
                    if ($safe.Length -gt 240) { $safe = $safe.Substring(0,240) }
                    $report['sanitized_' + $name] = $safe
                }
            }
        } catch { $report['response_format'] = 'non-json; content withheld' }
        $body = $null
        $data = $null
    }
    [pscustomobject]$report | ConvertTo-Json -Depth 4
} catch {
    [Console]::Error.WriteLine('Diagnostics could not complete. No response body or token was emitted.')
    exit 1
} finally {
    $token = $null
    if ($response) { $response.Dispose() }
    $request.Dispose()
    $client.Dispose()
    $handler.Dispose()
}
