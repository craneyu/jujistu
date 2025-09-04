# 字體顏色規範提醒

## 重要原則
所有文字顏色必須保持足夠的對比度，確保清晰可讀

## 標準顏色配置

### 一般文字
- 主要內容：`text-gray-900` (最深)
- 次要內容：`text-gray-800` 
- 輔助說明：`text-gray-700`
- 禁用狀態：`text-gray-500`

### 表單元素
- Label 標籤：`text-gray-900 font-medium`
- Input 內文字：`text-gray-900`
- Placeholder：`placeholder:text-gray-500` (這是唯一可以較淡的地方)
- 錯誤訊息：`text-red-600`

### 按鈕
- 主要按鈕：白色文字配深色背景
- 次要按鈕：`text-gray-900` 配淺色背景
- 登出按鈕：`text-white` 配 `bg-red-600`

### 特殊元素
- 標題：`text-gray-900 font-bold`
- 連結：`text-blue-600 hover:text-blue-700`
- 成功訊息：`text-green-700`
- 警告訊息：`text-yellow-700`
- 錯誤訊息：`text-red-700`

## 避免使用
- ❌ text-gray-400 (太淡)
- ❌ text-gray-500 (除了 placeholder 外避免使用)
- ❌ text-gray-600 (可見度不佳)
- ❌ 半透明白色文字在淺色背景上

## 檢查清單
1. 所有文字是否清晰可見？
2. 是否有足夠的對比度？
3. 在不同螢幕亮度下是否都能閱讀？
4. 表單的 label 和 input 文字是否夠深？