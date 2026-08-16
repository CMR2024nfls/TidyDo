<script setup>
import { ref, nextTick, watch } from 'vue';
import MessageBubble from './MessageBubble.vue';

const props = defineProps({
  messages: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
});

const thinkMode = defineModel('thinkMode', { type: Boolean, default: false });
const jsonMode = defineModel('jsonMode', { type: Boolean, default: false });

const emit = defineEmits(['send', 'clear']);

const messageInput = ref('');
const inputEl = ref(null);
const messagesEl = ref(null);

watch(
  () => [props.messages.length, props.loading],
  async () => {
    await nextTick();
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  }
);

async function onSend() {
  const text = messageInput.value;
  if (!text.trim()) return;
  emit('send', text);
  messageInput.value = '';
  await nextTick();
  if (inputEl.value) inputEl.value.style.height = 'auto';
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    onSend();
  }
}

function onInput(e) {
  e.target.style.height = 'auto';
  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
}
</script>

<template>
  <div id="chat-container">
    <div id="messages" ref="messagesEl">
      <MessageBubble v-for="(m, i) in messages" :key="i" :message="m" />
      <div v-if="loading" class="message assistant">
        <div class="role-label">Assistant</div>
        <div class="content"><span class="loading-dots">Thinking</span></div>
      </div>
    </div>
    <div id="input-area">
      <textarea
        id="message-input"
        rows="1"
        ref="inputEl"
        placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
        v-model="messageInput"
        @keydown="onKeydown"
        @input="onInput"
      ></textarea>
      <div id="input-bar">
        <label class="json-toggle" title="Enable deep thinking (reasoning)">
          <input type="checkbox" v-model="thinkMode">
          Think
        </label>
        <label class="json-toggle" title="Request response in JSON format">
          <input type="checkbox" v-model="jsonMode">
          JSON Output
        </label>
        <button id="clear-btn" @click="emit('clear')">Clear</button>
        <button id="send-btn" :disabled="loading" @click="onSend">Send</button>
      </div>
    </div>
  </div>
</template>