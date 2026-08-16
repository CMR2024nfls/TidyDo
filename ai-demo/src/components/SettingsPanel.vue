<script setup>
import { computed } from 'vue';

const props = defineProps({
  providers: { type: Object, required: true },
  currentProvider: { type: String, required: true },
  keyStatus: { type: Object, default: () => ({ text: '', color: '' }) }
});

const apiKey = defineModel('apiKey', { type: String, default: '' });
const model = defineModel('model', { type: String, default: '' });
const systemPrompt = defineModel('systemPrompt', { type: String, default: '' });

const emit = defineEmits(['set-provider', 'save-key']);

const currentModels = computed(() => props.providers[props.currentProvider].models);
</script>

<template>
  <div id="settings">
    <div id="provider-tabs">
      <button
        v-for="(conf, key) in providers"
        :key="key"
        class="provider-tab"
        :class="{ active: currentProvider === key }"
        @click="emit('set-provider', key)"
      >{{ conf.name }}</button>
    </div>
    <div class="settings-body">
      <div class="setting-row">
        <label>API Key</label>
        <div class="input-group">
          <input
            type="password"
            id="api-key"
            placeholder="sk-..."
            spellcheck="false"
            v-model="apiKey"
            @keydown.enter="emit('save-key')"
          >
          <button id="save-key" @click="emit('save-key')">Save</button>
        </div>
        <span id="key-status" :style="{ color: keyStatus.color }">{{ keyStatus.text }}</span>
      </div>
      <div class="setting-row">
        <label>Model</label>
        <select id="model-select" v-model="model">
          <option v-for="m in currentModels" :key="m" :value="m">{{ m }}</option>
        </select>
      </div>
      <div class="setting-row">
        <label>System</label>
        <textarea
          id="system-prompt"
          rows="3"
          placeholder="Optional: set a system prompt..."
          v-model="systemPrompt"
        ></textarea>
      </div>
    </div>
  </div>
</template>