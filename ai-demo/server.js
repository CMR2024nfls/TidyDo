const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PROVIDERS = {
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    models: ['deepseek-v4-flash']
  },
  siliconflow: {
    name: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: ['DeepSeek-V4-Flash', 'Qwen3.5-9B', 'Qwen3.5-4B']
  },
  minimax: {
    name: 'MiniMax',
    baseUrl: 'https://api.minimaxi.com/v1',
    models: ['MiniMax-M3']
  },
  zhipu: {
    name: 'GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4.7']
  }
};

app.post('/api/chat', async (req, res) => {
  const { provider, model, messages, apiKey, thinkMode, jsonMode } = req.body;

  if (!provider || !model || !messages || !apiKey) {
    return res.status(400).json({ error: 'Missing required fields: provider, model, messages, apiKey' });
  }

  const config = PROVIDERS[provider];
  if (!config) {
    return res.status(400).json({ error: `Unknown provider "${provider}". Supported: ${Object.keys(PROVIDERS).join(', ')}` });
  }

  const body = { model, messages, stream: false };
  if (!thinkMode) {
    if (provider === 'minimax' || provider === 'zhipu') {
      body.thinking = { type: 'disabled' };
    } else {
      body.enable_thinking = false;
    }
  }
  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  try {
    const apiResponse = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json({
        error: data.error?.message || data.error || `API returned HTTP ${apiResponse.status}`
      });
    }

    res.json({ content: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: `Proxy error: ${err.message}` });
  }
});

app.get('/api/providers', (req, res) => {
  res.json(PROVIDERS);
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`TidyDo API proxy running at http://localhost:${PORT}`);
});
