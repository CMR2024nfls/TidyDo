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

- 前端：Vue 3（Composition API）+ Vite，单文件组件，带简易 Markdown 渲染。
  - `index.html` / `vite.config.js`：Vite 入口与配置（开发时 `/api` 代理到后端）。
  - `src/main.js` / `src/App.vue`：应用入口与全局状态。
  - `src/components/`：`SettingsPanel.vue`（厂商/密钥/模型/System Prompt）、`ChatWindow.vue`（对话区/输入区）、`MessageBubble.vue`（单条消息）。
  - `src/utils/markdown.js`：简易 Markdown 渲染器。
- `server.js`：Express 代理服务器，统一转发请求到各 AI 服务器，避免前端跨域并保护密钥；构建后同时托管 `dist/`。

## 运行

**开发模式**（前端热更新 + 后端代理，一条命令）：

```bash
npm install
npm run dev
```

- Vite 前端：`http://localhost:5173`
- Express 代理：`http://localhost:3000`（`/api` 由 Vite 自动转发）

**生产模式**：

```bash
npm run build   # 构建前端到 dist/
npm start       # Express 托管 dist/ + /api，访问 http://localhost:3000
```

## 使用

1. 选择厂商 Tab，填入对应 API 密钥并点击 **Save**。
2. 选择模型，如需可填写 System Prompt。
3. 按需勾选 **Think** 或 **JSON Output**。
4. 输入消息发送（Enter 发送，Shift+Enter 换行），进行多轮对话。
5. 点击 **Clear** 清空当前对话。

回复支持 Markdown 渲染：标题、粗体/斜体、行内代码、围栏代码块、列表、引用、链接、分隔线。

## 请求参数说明

后端会根据勾选项向 AI 服务器附加参数：

- **Think 关闭**：SiliconFlow/DeepSeek 传 `enable_thinking: false`；MiniMax/GLM 传 `thinking: { "type": "disabled" }`。
- **Think 开启**：不传上述参数，由模型默认策略决定。
- **JSON Output 开启**：传 `response_format: { "type": "json_object" }`。