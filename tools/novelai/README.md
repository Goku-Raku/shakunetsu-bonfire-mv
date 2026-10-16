# NovelAI 本機接入

這個工具使用你的 NovelAI 帳號，透過官方 API 檢查訂閱、按要求生成單張圖片。設定工具不會生圖。

訂閱查詢與圖片生成皆使用 `https://image.novelai.net`，與目前官方前端一致。本次對舊主 API 網址查詢訂閱回 HTTP 400，服務要求改用圖片 API；修正網址後，原 Token 已通過驗證，不需要重新產生。

## 取得與保存 Token

1. 登入 <https://novelai.net/>。
2. 開啟 **User Settings → Account → Get Persistent API Token**。
3. 如果尚未產生 Token，依網站提示產生並按複製圖示。**產生新 Token 會讓舊 Token 失效**；若其他工具仍在使用，請沿用已保存的 Token。
4. 雙擊同資料夾的 **01-設定Token.cmd**。
5. 在遮罩欄位貼上 Token，按 **儲存 Token**，再按 **檢查連線**。
6. 出現「連線成功」即代表帳號驗證通過；它不代表已測試生圖。接著可回到聊天，指定要用 NovelAI 生成的內容。

Token 不需要貼到聊天、指令、設定 JSON 或環境變數。請不要把 Token 彈窗截圖傳到聊天。

Token 以 Windows DPAPI CurrentUser 加密，保存於 `tools/novelai/.private/token.dpapi`；資料夾存取權限限制為目前 Windows 使用者與 SYSTEM。它適用於目前 Windows 帳戶與電腦環境，不是可攜式密碼保險箱，同一登入帳號下的程式仍有能力使用它。更換電腦／帳號時請重新設定。覆寫時會保留上一份加密檔 `token.previous.dpapi`。`.private` 已列入 Git 忽略清單，分享專案壓縮檔時也請排除整個 `.private`。

## 生成方式

把 `request.example.json` 複製為這次要用的請求檔，再修改提示詞、模型、尺寸、步數與 seed。V4/V4.5 的 `input` 與 `v4_prompt.caption.base_caption` 必須一致；負面提示詞也請同時修改 `negative_prompt` 與 `v4_negative_prompt.caption.base_caption`。不要在請求 JSON 裡放 Token。

在此專案根目錄執行：

```powershell
# 查看是否已保存 Token，不解密或顯示 Token
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\novelai\NovelAI.ps1 -Action Status

# 只查訂閱，不生圖
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\novelai\NovelAI.ps1 -Action Check

# 預覽生成參數，不發送請求
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\novelai\NovelAI.ps1 -Action Generate -RequestFile .\tools\novelai\request.example.json

# 真正生成一張，可能消耗你的 NovelAI 額度
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\novelai\NovelAI.ps1 -Action Generate -RequestFile .\tools\novelai\request.example.json -Execute
```

圖片與參數記錄預設保存到 `F:\ai影片\灼熱bonfire mv\source\novelai\時間-隨機碼\`，不覆寫已有圖片。預覽會顯示 `output_directory`，可先確認位置。單次只產生一張，無背景排程或自動重試。若生成逾時，先核對網站用量再重試，避免重複扣額。

`-OutputDirectory` 是這個腳本的參數，不能單獨貼到 PowerShell 執行。如需當次另選位置，請使用完整指令（以下只預覽，不生圖）：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "F:\ai影片\灼熱bonfire mv\tools\novelai\NovelAI.ps1" -Action Generate -OutputDirectory "F:\ai影片\灼熱bonfire mv\source\novelai"
```

只有明確要求實際生成時，才在完整指令末尾加上 `-Execute`；也請先用 `-RequestFile` 指向這次已準備好的提示詞請求檔。

目前支援 Anime V3、V4、V4.5 文生圖及單張圖生圖；範例使用 **V4.5 Full、1024×1024、23 步**，未自動追加品質標籤。官方另有 V5；這版尚未接入其個別參數及額度規則。圖片可使用角色提示詞；Vibe Transfer、Precise Reference、修補和批次生成尚未在這個工具接入或驗證。

## 單張圖生圖

每張圖仍從 `request.example.json` 複製一份獨立請求，保留原有模型、提示詞、seed 和參數；作以下修改：

- 頂層 `action` 改為 `img2img`，增加 `image_file`，值為本機 PNG 絕對路徑或相對於請求 JSON 的路徑。網路路徑不支援。
- `parameters` 增加 `strength`、`noise` 和 `extra_noise_seed`。前兩者必須是 0–1 的數字，後者必須是 0–4294967295 的整數。例如 `strength: 0.35`、`noise: 0.05`、`extra_noise_seed: 123456789`。
- PNG 不得超過 16 MB，必須可解碼，尺寸必須與 `parameters.width`、`parameters.height` 完全一致。工具不會自動縮放或裁圖。原本的尺寸、步數和單張限制仍適用：寬高為 64–2048 內的 64 倍數、面積最多 3145728 像素、1–50 步、`n_samples: 1`。
- V4/V4.5 的正面與負面 base caption 均須同步對應頂層提示詞，否則在送出前拒絕。

以下指令先預覽本次參數，輸出放在 `source` 外的 `novelai-restyle`。將 `member_pareo.json` 換成實際準備好的請求檔：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\novelai\NovelAI.ps1" -Action Generate -RequestFile ".\novelai-restyle\requests\member_pareo.json" -OutputDirectory ".\novelai-restyle\generations"
```

確定要生成這一張時才在同一條完整指令末尾加 `-Execute`。預覽包含 `action`、來源路徑、`strength`、`noise` 與 seed，不顯示圖片 base64。每次執行仍只送一個請求，不自動重試或在背景批次生成。

工具在記憶體中把本機 PNG 轉成 API 的 `parameters.image`，移除本機專用的 `image_file`。輸出目錄內的 `request.json` 保存完整內嵌圖片、提示詞、seed 與設定，可獨立重放，因此檔案會較大；請求 JSON 上限為 32 MB。也可以直接提供這種已保存的內嵌 PNG 請求，但不能同時提供 `image_file` 和 `parameters.image`。這些記錄不包含 Token。

PNG 輸出不代表模型保留了透明背景。立繪的 alpha 和人物輪廓須在生成後另外檢查；原圖的遮罩也不保證適合新輪廓。

## 驗證範圍

- `Test-Local.ps1` 使用隔離資料夾、假 Token 與模擬回應測試 Windows 加密、受限存取權限、備份、參數檢查與 PNG 儲存，不讀真實 Token、不連網。
- `Test-Img2Img.ps1` 不讀任何憑證並直接替換網路函式，離線檢查來源 PNG、大小和尺寸、參數限制、V4 正負提示詞同步、預覽不洩露 base64、保存與重放、文生圖回歸及失敗不重試。這些測試不代表已通過真實圖生圖服務驗證。
- API 帳號驗證須在正常 Windows 使用者環境下執行。受限代理環境可能阻擋 DPAPI 或網路，這時應透過正式權限核准執行同一工具。
- 2026-10-17 已完成此帳號的真實唯讀訂閱驗證：連線成功、訂閱有效。尚未送出實際生圖請求；生圖參數與圖片輸出仍須以首次生成結果確認。

官方參考：

- [帳號及 Token 說明](https://docs.novelai.net/en/text/usersettings/account/)
- [生圖 API 定義](https://image.novelai.net/docs/doc.json)
- [主 API 定義](https://api.novelai.net/docs/swagger-ui-init.js)
- [模型說明](https://docs.novelai.net/en/image/models/)
