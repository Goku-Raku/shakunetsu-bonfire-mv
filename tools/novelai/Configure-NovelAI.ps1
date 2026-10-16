param([switch]$CheckLayout, [switch]$CheckConnectionOnOpen)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
# Process-local: do not inherit another PowerShell version's modules.
$env:PSModulePath = [IO.Path]::Combine($PSHOME, 'Modules')
$script:SetupVersion = '1.3'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

try {
    Import-Module (Join-Path $PSScriptRoot 'NovelAI.Core.psm1') -Force -ErrorAction Stop
}
catch {
    [void][System.Windows.Forms.MessageBox]::Show(
        "無法載入 NovelAI 本機連線元件。請確認 NovelAI.Core.psm1 與本檔放在同一個資料夾。`r`n`r`n$($_.Exception.Message)",
        'NovelAI 設定', 'OK', 'Error')
    exit 1
}

$form = New-Object System.Windows.Forms.Form
$form.Text = 'NovelAI｜本機 Token 設定 v1.3'
$form.ClientSize = New-Object System.Drawing.Size(760, 675)
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.StartPosition = 'CenterScreen'
$form.Font = New-Object System.Drawing.Font('Microsoft JhengHei UI', 10)
$form.BackColor = [System.Drawing.Color]::FromArgb(248, 249, 251)

$heading = New-Object System.Windows.Forms.Label
$heading.Text = '連接你的 NovelAI 帳號'
$heading.Location = New-Object System.Drawing.Point(24, 20)
$heading.Size = New-Object System.Drawing.Size(710, 32)
$heading.Font = New-Object System.Drawing.Font('Microsoft JhengHei UI', 16, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($heading)

$instructions = New-Object System.Windows.Forms.Label
$instructions.Location = New-Object System.Drawing.Point(26, 66)
$instructions.Size = New-Object System.Drawing.Size(705, 148)
$instructions.Text = @'
1. 按「開啟 NovelAI」，登入你的帳號。
2. 前往 User Settings（使用者設定）> Account（帳號）。
3. 按 Get Persistent API Token，複製產生的 Token。
4. 回到這裡貼入下方欄位，按「儲存 Token」。

請勿把 Token 貼到聊天、截圖或共用文件。
重新產生 Persistent API Token 後，舊 Token 會失效。
'@
$form.Controls.Add($instructions)

$tokenLabel = New-Object System.Windows.Forms.Label
$tokenLabel.Text = 'API Token（僅在本機貼入；內容會遮罩）'
$tokenLabel.Location = New-Object System.Drawing.Point(26, 222)
$tokenLabel.Size = New-Object System.Drawing.Size(700, 25)
$form.Controls.Add($tokenLabel)

$tokenBox = New-Object System.Windows.Forms.TextBox
$tokenBox.Location = New-Object System.Drawing.Point(26, 251)
$tokenBox.Size = New-Object System.Drawing.Size(706, 30)
$tokenBox.UseSystemPasswordChar = $true
$tokenBox.ShortcutsEnabled = $true
$tokenBox.TabIndex = 0
$form.Controls.Add($tokenBox)

$saveButton = New-Object System.Windows.Forms.Button
$saveButton.Text = '儲存 Token'
$saveButton.Location = New-Object System.Drawing.Point(26, 296)
$saveButton.Size = New-Object System.Drawing.Size(146, 38)
$saveButton.TabIndex = 1
$form.Controls.Add($saveButton)

$testButton = New-Object System.Windows.Forms.Button
$testButton.Text = '檢查連線'
$testButton.Location = New-Object System.Drawing.Point(184, 296)
$testButton.Size = New-Object System.Drawing.Size(146, 38)
$testButton.TabIndex = 2
$form.Controls.Add($testButton)

$openButton = New-Object System.Windows.Forms.Button
$openButton.Text = '開啟 NovelAI'
$openButton.Location = New-Object System.Drawing.Point(342, 296)
$openButton.Size = New-Object System.Drawing.Size(146, 38)
$openButton.TabIndex = 3
$form.Controls.Add($openButton)

$privacyNote = New-Object System.Windows.Forms.Label
$privacyNote.Location = New-Object System.Drawing.Point(26, 349)
$privacyNote.Size = New-Object System.Drawing.Size(705, 64)
$privacyNote.Text = "Token 會使用 Windows DPAPI 加密，只有目前 Windows 使用者可解密使用。`r`n儲存後會立即清空輸入欄位。檢查連線只讀取帳號狀態，不生圖、不扣生成額度。"
$privacyNote.ForeColor = [System.Drawing.Color]::FromArgb(70, 77, 88)
$form.Controls.Add($privacyNote)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = '連線狀態'
$statusLabel.Location = New-Object System.Drawing.Point(26, 421)
$statusLabel.Size = New-Object System.Drawing.Size(706, 25)
$statusLabel.Font = New-Object System.Drawing.Font('Microsoft JhengHei UI', 10, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($statusLabel)

$statusBox = New-Object System.Windows.Forms.TextBox
$statusBox.Location = New-Object System.Drawing.Point(26, 451)
$statusBox.Size = New-Object System.Drawing.Size(706, 154)
$statusBox.Multiline = $true
$statusBox.ReadOnly = $true
$statusBox.ScrollBars = 'Vertical'
$statusBox.BackColor = [System.Drawing.Color]::White
$statusBox.TabIndex = 4
$form.Controls.Add($statusBox)

$closeButton = New-Object System.Windows.Forms.Button
$closeButton.Text = '關閉'
$closeButton.Location = New-Object System.Drawing.Point(612, 622)
$closeButton.Size = New-Object System.Drawing.Size(120, 34)
$closeButton.TabIndex = 5
$closeButton.DialogResult = 'Cancel'
$form.Controls.Add($closeButton)
$form.CancelButton = $closeButton

function Set-SetupBusy {
    param([bool]$Busy)
    $saveButton.Enabled = -not $Busy
    $testButton.Enabled = -not $Busy
    $openButton.Enabled = -not $Busy
    $tokenBox.Enabled = -not $Busy
    $closeButton.Enabled = -not $Busy
    $form.UseWaitCursor = $Busy
    if ($Busy) { [System.Windows.Forms.Application]::DoEvents() }
}

function Get-SafeCountText {
    param($Value)
    if ($null -eq $Value) { return '未提供' }
    if ($Value -is [string] -or $Value -is [ValueType]) { return [string]$Value }
    return ($Value | ConvertTo-Json -Depth 4 -Compress)
}

$saveButton.Add_Click({
    $secureToken = $null
    $plainToken = $null
    try {
        if ([string]::IsNullOrWhiteSpace($tokenBox.Text)) {
            [void][System.Windows.Forms.MessageBox]::Show($form, '請先將 Token 貼入遮罩欄位。', '尚未輸入 Token', 'OK', 'Information')
            $tokenBox.Focus()
            return
        }

        $current = Get-NAIStatus
        if ($current.token_saved) {
            $choice = [System.Windows.Forms.MessageBox]::Show(
                $form, '本機已有加密儲存的 Token。要以目前輸入的 Token 取代嗎？',
                '取代本機 Token', 'YesNo', 'Question', 'Button2')
            if ($choice -ne [System.Windows.Forms.DialogResult]::Yes) { return }
        }

        $plainToken = $tokenBox.Text.Trim()
        $tokenBox.Clear()
        $secureToken = [Security.SecureString]::new()
        for ($charIndex = 0; $charIndex -lt $plainToken.Length; $charIndex++) {
            $secureToken.AppendChar($plainToken[$charIndex])
        }
        $secureToken.MakeReadOnly()
        $plainToken = $null
        Set-SetupBusy -Busy $true
        Set-NAIToken -Token $secureToken
        $saved = Get-NAIStatus
        $statusBox.Text = "Token 已加密儲存。`r`n位置：$($saved.credential_path)`r`n`r`n尚未驗證連線。請按「檢查連線」確認帳號狀態。"
    }
    catch {
        $statusBox.Text = "儲存失敗：$($_.Exception.Message)`r`n`r`n輸入欄位已清空；請重新貼入後再試。"
    }
    finally {
        if ($null -ne $secureToken) { $secureToken.Dispose() }
        $plainToken = $null
        $secureToken = $null
        $tokenBox.Clear()
        Set-SetupBusy -Busy $false
    }
})

$testButton.Add_Click({
    try {
        $current = Get-NAIStatus
        if (-not $current.token_saved) {
            $statusBox.Text = '尚未設定 Token。請先貼入 Token 並按「儲存 Token」。'
            return
        }

        $statusBox.Text = '正在檢查 NovelAI 帳號連線……'
        Set-SetupBusy -Busy $true
        $result = Test-NAIConnection
        if (-not $result.connected) { throw 'NovelAI 未確認連線成功，請稍後再試。' }
        $form.Text = 'NovelAI｜已連線 v1.3'
        $activeText = if ($result.active) { '有效' } else { '未啟用／未生效' }
        $fixedText = Get-SafeCountText -Value $result.fixed_training_steps_left
        $purchasedText = Get-SafeCountText -Value $result.purchased_training_steps
        $statusBox.Text = "連線成功。`r`n訂閱狀態：$activeText　方案代碼：$($result.tier)`r`n訂閱額度（API 回傳）：$fixedText`r`n購買額度（API 回傳）：$purchasedText`r`n`r`n此次只讀取帳號狀態，未生圖。"
    }
    catch {
        $statusBox.Text = "連線檢查失敗：$($_.Exception.Message)`r`n`r`n請確認網路與 Token；若已重新產生 Token，請先儲存新的 Token。"
    }
    finally {
        Set-SetupBusy -Busy $false
    }
})

$openButton.Add_Click({
    try { Start-Process 'https://novelai.net/' }
    catch { $statusBox.Text = '無法開啟預設瀏覽器。請自行在瀏覽器開啟 https://novelai.net/。' }
})

$closeButton.Add_Click({ $form.Close() })
$form.Add_FormClosed({ $tokenBox.Clear() })
$form.Add_Shown({ if ($CheckConnectionOnOpen) { $testButton.PerformClick() } })

try {
    $initial = Get-NAIStatus
    if ($initial.token_saved) {
        $statusBox.Text = "已找到本機加密 Token。`r`n位置：$($initial.credential_path)`r`n`r`n尚未驗證連線。請按「檢查連線」。"
    }
    else {
        $statusBox.Text = "尚未設定 Token。`r`n儲存位置：$($initial.credential_path)`r`n`r`n依上方步驟取得 Token，並只在本機遮罩欄位貼入。"
    }
    if ($CheckLayout) { [pscustomobject]@{ title=$form.Text; controls=$form.Controls.Count; width=$form.ClientSize.Width; height=$form.ClientSize.Height } | ConvertTo-Json } else { [void]$form.ShowDialog() }
}
finally {
    $tokenBox.Clear()
    $form.Dispose()
}
