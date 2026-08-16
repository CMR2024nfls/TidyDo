const PROXY_URL = 'http://localhost:3000';

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

let currentProvider = 'deepseek';
let conversation = [];

const $ = (id) => document.getElementById(id);
const providerTabs = document.querySelectorAll('.provider-tab');
const apiKeyInput = $('api-key');
const saveKeyBtn = $('save-key');
const keyStatus = $('key-status');
const modelSelect = $('model-select');
const systemPrompt = $('system-prompt');
const messagesEl = $('messages');
const messageInput = $('message-input');
const sendBtn = $('send-btn');
const clearBtn = $('clear-btn');
const thinkModeChk = $('think-mode');
const jsonModeChk = $('json-mode');

function init() {
  currentProvider = localStorage.getItem(STORAGE.provider) || 'deepseek';
  applyProvider(currentProvider);
  const sp = localStorage.getItem(STORAGE.systemPrompt);
  if (sp) systemPrompt.value = sp;
  thinkModeChk.checked = localStorage.getItem(STORAGE.thinkMode) === '1';
  bindEvents();
}

function applyProvider(provider) {
  currentProvider = provider;
  providerTabs.forEach((t) => t.classList.toggle('active', t.dataset.provider === provider));
  const key = localStorage.getItem(STORAGE.apiKey(provider));
  apiKeyInput.value = key || '';
  keyStatus.textContent = key ? '\u2713 Saved' : '';
  keyStatus.style.color = key ? '#4caf50' : '';
  const conf = PROVIDERS[provider];
  modelSelect.innerHTML = conf.models.map((m) => `<option value="${m}">${m}</option>`).join('');
  localStorage.setItem(STORAGE.provider, provider);
}

function saveApiKey() {
  const val = apiKeyInput.value.trim();
  if (!val) {
    keyStatus.textContent = 'Empty';
    keyStatus.style.color = '#f44336';
    return;
  }
  localStorage.setItem(STORAGE.apiKey(currentProvider), val);
  keyStatus.textContent = '\u2713 Saved';
  keyStatus.style.color = '#4caf50';
}

function addMsg(role, content) {
  const el = document.createElement('div');
  el.className = `message ${role}`;
  const label = { user: 'You', assistant: 'Assistant', system: 'System' }[role] || role;
  el.innerHTML = `<div class="role-label">${label}</div><div class="content">${renderMarkdown(content)}</div>`;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showLoading() {
  const el = document.createElement('div');
  el.className = 'message assistant';
  el.id = 'loading-msg';
  el.innerHTML = '<div class="role-label">Assistant</div><div class="content"><span class="loading-dots">Thinking</span></div>';
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function rmLoading() {
  const el = document.getElementById('loading-msg');
  if (el) el.remove();
}

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const apiKey = localStorage.getItem(STORAGE.apiKey(currentProvider));
  if (!apiKey) {
    keyStatus.textContent = 'Save key first';
    keyStatus.style.color = '#f44336';
    return;
  }

  const model = modelSelect.value;
  const sp = systemPrompt.value.trim();
  const thinkMode = thinkModeChk.checked;
  const jsonMode = jsonModeChk.checked;

  messageInput.value = '';
  messageInput.style.height = 'auto';

  addMsg('user', text);

  const msgs = [];
  if (sp) msgs.push({ role: 'system', content: sp });
  msgs.push(...conversation);
  msgs.push({ role: 'user', content: text });

  showLoading();
  sendBtn.disabled = true;

  try {
    const res = await fetch(`${PROXY_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: currentProvider,
        model,
        messages: msgs,
        apiKey,
        thinkMode,
        jsonMode
      })
    });

    const data = await res.json();
    rmLoading();

    if (!res.ok) {
      addMsg('system', `Error: ${data.error || 'Unknown error'}`);
      return;
    }

    addMsg('assistant', data.content);
    conversation.push({ role: 'user', content: text });
    conversation.push({ role: 'assistant', content: data.content });
  } catch (err) {
    rmLoading();
    addMsg('system', `Network error: ${err.message}. Is the proxy running at ${PROXY_URL}?`);
  } finally {
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

function clearChat() {
  conversation = [];
  messagesEl.innerHTML = '';
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inlineMd(s) {
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/_([^_]+)_/g, '<em>$1</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  return s;
}

function renderMarkdown(src) {
  if (!src) return '';
  const blocks = escHtml(src).split(/```/);
  let out = '';
  let list = null;
  let para = [];

  const closeList = () => {
    if (list === 'ul') out += '</ul>\n';
    else if (list === 'ol') out += '</ol>\n';
    list = null;
  };
  const flushPara = () => {
    if (para.length) {
      out += '<p>' + para.join('<br>') + '</p>\n';
      para = [];
    }
  };

  for (let i = 0; i < blocks.length; i++) {
    if (i % 2 === 1) {
      flushPara();
      closeList();
      let code = blocks[i].replace(/^\n/, '');
      let lang = '';
      const nl = code.indexOf('\n');
      const first = code.split('\n')[0].trim();
      if (first && !/\s/.test(first) && nl !== -1) {
        lang = code.slice(0, nl).trim();
        code = code.slice(nl + 1);
      } else if (first && !/\s/.test(first)) {
        lang = first;
        code = '';
      }
      out += `<pre><code${lang ? ` class="language-${escHtml(lang)}"` : ''}>${code}</code></pre>\n`;
      continue;
    }

    for (const line of blocks[i].split('\n')) {
      let m;
      if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
        flushPara();
        closeList();
        out += `<h${m[1].length}>${inlineMd(m[2])}</h${m[1].length}>\n`;
      } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        flushPara();
        closeList();
        out += '<hr>\n';
      } else if ((m = line.match(/^&gt;\s?(.*)$/))) {
        flushPara();
        closeList();
        out += `<blockquote>${inlineMd(m[1])}</blockquote>\n`;
      } else if ((m = line.match(/^[-*+]\s+(.*)$/))) {
        flushPara();
        if (list !== 'ul') {
          closeList();
          out += '<ul>\n';
          list = 'ul';
        }
        out += `<li>${inlineMd(m[1])}</li>\n`;
      } else if ((m = line.match(/^\d+[.)]\s+(.*)$/))) {
        flushPara();
        if (list !== 'ol') {
          closeList();
          out += '<ol>\n';
          list = 'ol';
        }
        out += `<li>${inlineMd(m[1])}</li>\n`;
      } else if (/^\s*$/.test(line)) {
        flushPara();
        closeList();
      } else {
        closeList();
        para.push(inlineMd(line));
      }
    }
    flushPara();
    closeList();
  }
  return out;
}

function bindEvents() {
  providerTabs.forEach((t) =>
    t.addEventListener('click', () => applyProvider(t.dataset.provider))
  );

  saveKeyBtn.addEventListener('click', saveApiKey);
  apiKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveApiKey();
  });

  thinkModeChk.addEventListener('change', () => {
    localStorage.setItem(STORAGE.thinkMode, thinkModeChk.checked ? '1' : '0');
  });

  let spTimer;
  systemPrompt.addEventListener('input', () => {
    clearTimeout(spTimer);
    spTimer = setTimeout(() => localStorage.setItem(STORAGE.systemPrompt, systemPrompt.value), 300);
  });

  sendBtn.addEventListener('click', sendMessage);

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
  });

  clearBtn.addEventListener('click', clearChat);
}

init();
