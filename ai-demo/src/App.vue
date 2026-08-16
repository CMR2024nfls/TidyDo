<script setup>
import { ref, watch, onMounted } from 'vue';
import SettingsPanel from './components/SettingsPanel.vue';
import ChatWindow from './components/ChatWindow.vue';

const PROVIDERS = {
  deepseek: { name: 'DeepSeek', models: ['deepseek-v4-flash'] },
  siliconflow: { name: 'SiliconFlow', models: ['DeepSeek-V4-Flash', 'Qwen3.5-9B', 'Qwen3.5-4B'] },
  minimax: { name: 'MiniMax', models: ['MiniMax-M3'] },
  zhipu: { name: 'GLM', models: ['glm-4.7'] }
};

const STORAGE = {
  apiKey: (p) => `tidydo_apikey_${p}`,
  systemPrompt: 'tidydo_system_prompt',
  provider: 'tidydo_provider',
  thinkMode: 'tidydo_think_mode'
};

const currentProvider = ref('deepseek');
const apiKey = ref('');
const model = ref('');
const systemPrompt = ref('');
const thinkMode = ref(false);
const jsonMode = ref(false);
const conversation = ref([]);
const messages = ref([]);
const loading = ref(false);
const keyStatus = ref({ text: '', color: '' });

function applyProvider(provider) {
  currentProvider.value = provider;
  const key = localStorage.getItem(STORAGE.apiKey(provider));
  apiKey.value = key || '';
  model.value = PROVIDERS[provider].models[0];
  keyStatus.value = key ? { text: '✓ Saved', color: '#4caf50' } : { text: '', color: '' };
  localStorage.setItem(STORAGE.provider, provider);
}

function saveApiKey() {
  const val = apiKey.value.trim();
  if (!val) {
    keyStatus.value = { text: 'Empty', color: '#f44336' };
    return;
  }
  localStorage.setItem(STORAGE.apiKey(currentProvider.value), val);
  keyStatus.value = { text: '✓ Saved', color: '#4caf50' };
}

async function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const key = apiKey.value.trim();
  if (!key) {
    keyStatus.value = { text: 'Save key first', color: '#f44336' };
    return;
  }

  messages.value.push({ role: 'user', content: trimmed });

  const msgs = [];
  if (systemPrompt.value.trim()) msgs.push({ role: 'system', content: systemPrompt.value.trim() });
  msgs.push(...conversation.value);
  msgs.push({ role: 'user', content: trimmed });

  loading.value = true;
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: currentProvider.value,
        model: model.value,
        messages: msgs,
        apiKey: key,
        thinkMode: thinkMode.value,
        jsonMode: jsonMode.value
      })
    });

    const data = await res.json();
    if (!res.ok) {
      messages.value.push({ role: 'system', content: `Error: ${data.error || 'Unknown error'}` });
      return;
    }

    messages.value.push({ role: 'assistant', content: data.content });
    conversation.value.push({ role: 'user', content: trimmed });
    conversation.value.push({ role: 'assistant', content: data.content });
  } catch (err) {
    messages.value.push({
      role: 'system',
      content: `Network error: ${err.message}. Is the proxy running at http://localhost:3000?`
    });
  } finally {
    loading.value = false;
  }
}

function clearChat() {
  conversation.value = [];
  messages.value = [];
}

onMounted(() => {
  currentProvider.value = localStorage.getItem(STORAGE.provider) || 'deepseek';
  applyProvider(currentProvider.value);
  const sp = localStorage.getItem(STORAGE.systemPrompt);
  if (sp) systemPrompt.value = sp;
  thinkMode.value = localStorage.getItem(STORAGE.thinkMode) === '1';
});

watch(systemPrompt, (v) => localStorage.setItem(STORAGE.systemPrompt, v));
watch(thinkMode, (v) => localStorage.setItem(STORAGE.thinkMode, v ? '1' : '0'));
</script>

<template>
  <div id="app">
    <header>
      <h1>TidyDo AI Chat</h1>
    </header>
    <SettingsPanel
      :providers="PROVIDERS"
      :current-provider="currentProvider"
      v-model:apiKey="apiKey"
      v-model:model="model"
      v-model:systemPrompt="systemPrompt"
      :key-status="keyStatus"
      @set-provider="applyProvider"
      @save-key="saveApiKey"
    />
    <ChatWindow
      :messages="messages"
      :loading="loading"
      v-model:thinkMode="thinkMode"
      v-model:jsonMode="jsonMode"
      @send="sendMessage"
      @clear="clearChat"
    />
  </div>
</template>