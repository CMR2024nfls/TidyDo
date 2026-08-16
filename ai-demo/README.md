# TidyDo AI Demo

一个前后端分离的简化 AI 对话 demo，用于演示 TidyDo 的 AI 集成。

## 功能

- **API 密钥存储**：密钥保存在浏览器 `localStorage` 中（按厂商分开存储），不经过后端落盘。
- **多轮对话**：自动携带历史消息上下文。
- **JSON Output**：每次发送消息可勾选"JSON Output"，强制模型返回 JSON 格式。
- **Think（深度思考）**：默认关闭深度思考以加快响应；勾选"Think"可启用模型的推理模式。
- **System Prompt**：可自定义系统提示词，自动写入 `localStorage`。

## 支持的 AI 服务器

| 厂商 | Base URL | 模型 |
| --- | --- | --- |
| DeepSeek | `https://api.deepseek.com` | `deepseek-v4-flash` |
| SiliconFlow | `https://api.siliconflow.cn/v1` | `DeepSeek-V4-Flash`、`Qwen3.5-9B`、`Qwen3.5-4B` |
| MiniMax | `https://api.minimaxi.com/v1` | `MiniMax-M3` |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4` | `glm-4.7` |

## 技术结构

- `index.html` / `style.css` / `app.js`：前端页面与交互逻辑。
- `server.js`：Express 代理服务器，统一转发请求到各 AI 服务器，避免前端跨域并保护密钥。

## 运行

```bash
npm install
npm start
```

启动后访问 `http://localhost:3000`（默认端口 `3000`，可用 `PORT` 环境变量修改）。

## 使用

1. 选择厂商 Tab，填入对应 API 密钥并点击 **Save**。
2. 选择模型，如需可填写 System Prompt。
3. 按需勾选 **Think** 或 **JSON Output**。
4. 输入消息发送（Enter 发送，Shift+Enter 换行），进行多轮对话。
5. 点击 **Clear** 清空当前对话。

## 请求参数说明

后端会根据勾选项向 AI 服务器附加参数：

- **Think 关闭**：SiliconFlow/DeepSeek 传 `enable_thinking: false`；MiniMax/GLM 传 `thinking: { "type": "disabled" }`。
- **Think 开启**：不传上述参数，由模型默认策略决定。
- **JSON Output 开启**：传 `response_format: { "type": "json_object" }`。