# Raspberry Pi Sensor Dashboard

本專案為樹莓派感測監控系統前端與 API 服務，搭配本地樹莓派電路進行資料採集，並透過 Vercel 與 Supabase 提供校內外可連線的即時監控頁面。

## Project Overview

系統功能包含：

- 顯示最新感測狀態
- 顯示目前模式（`standby` / `collecting`）
- 顯示在線狀態（`Online` / `Offline`）
- 顯示最近 10 筆歷史紀錄
- 由樹莓派定時上傳距離、溫度、濕度與人體偵測結果

## Hardware Pins

本專案目前使用的 GPIO 腳位如下：

- `DHT11 Data` -> `GPIO4`
- `HC-SR04 Trig` -> `GPIO14`
- `HC-SR04 Echo` -> `GPIO15`

注意事項：

- `HC-SR04 Echo` 為 5V，接入樹莓派 GPIO 前必須使用分壓或電平轉換。

## System Architecture

資料流如下：

`Raspberry Pi Sensors -> Raspberry Pi Python Script -> Vercel API -> Supabase -> Vercel Dashboard`

各元件角色：

- `Raspberry Pi Python Script`
  - 讀取 DHT11 與 HC-SR04
  - 將資料上傳至 `/api/ingest`
- `Vercel API`
  - 驗證 `DEVICE_INGEST_TOKEN`
  - 將資料寫入 Supabase
- `Supabase`
  - 儲存最新狀態與歷史紀錄
- `Vercel Frontend`
  - 顯示即時狀態與最近資料

## Database Tables

本專案使用 Supabase，主要資料表如下：

- `device_status`
  - 儲存最新裝置狀態
- `sensor_logs`
  - 儲存歷史感測紀錄

## Environment Variables

請在 `.env.local` 中設定以下變數：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
DEVICE_INGEST_TOKEN=your_custom_ingest_token
```

說明：

- `NEXT_PUBLIC_SUPABASE_URL`
  - 前端與後端共用的 Supabase 專案網址
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - 前端查詢資料使用
- `SUPABASE_SECRET_KEY`
  - 僅供 Vercel API server-side 使用
- `DEVICE_INGEST_TOKEN`
  - 樹莓派上傳資料到 API 時使用的驗證 token

## Local Development

安裝依賴：

```bash
npm install
```

啟動本機開發伺服器：

```bash
npm run dev
```

開啟：

```text
http://localhost:3000
```

## API Endpoints

### `POST /api/ingest`

樹莓派上傳感測資料使用。

Request headers:

```http
Authorization: Bearer <DEVICE_INGEST_TOKEN>
Content-Type: application/json
```

Request body example:

```json
{
  "device_id": "LinRASP1",
  "captured_at": "2026-05-24T12:30:00Z",
  "distance_m": 0.62,
  "temperature_c": 27.8,
  "humidity": 69.3,
  "person_detected": true,
  "mode": "collecting"
}
```

### `GET /api/device-status`

前端 dashboard 讀取最新狀態與最近 10 筆紀錄使用。

## Deployment

本專案部署於 Vercel。

部署步驟：

1. 將專案 push 到 GitHub
2. 在 Vercel 匯入 GitHub repository
3. 設定環境變數
4. 部署完成後取得正式網址
5. 將樹莓派程式中的 `API_URL` 改為正式網址：

```python
API_URL = "https://your-project-name.vercel.app/api/ingest"
```

## Offline Detection

前端會根據 `last_seen` 判斷在線狀態：

- `30 秒內有更新` -> `Online`
- `超過 30 秒未更新` -> `Offline`

這樣即使樹莓派程式暫停，網站仍能顯示最後資料並正確標示離線。

## Tech Stack

- `Next.js`
- `TypeScript`
- `Tailwind CSS`
- `Supabase`
- `Vercel`

## Notes

- `.env.local` 已加入 `.gitignore`，不應上傳到 GitHub。
- `SUPABASE_SECRET_KEY` 不可放在前端程式碼中。
- `DEVICE_INGEST_TOKEN` 應與樹莓派上傳程式保持一致。
