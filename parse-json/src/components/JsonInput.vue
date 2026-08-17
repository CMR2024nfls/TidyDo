<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  error: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue', 'parse']);

function onInput(e) {
  emit('update:modelValue', e.target.value);
}
</script>

<template>
  <div class="json-input">
    <div class="panel-title">1. 输入 JSON</div>
    <textarea
      class="json-area"
      :value="modelValue"
      spellcheck="false"
      placeholder='{"title":"任务简述","steps":["步骤1","步骤2"]}'
      @input="onInput"
    ></textarea>
    <div class="row">
      <button class="btn primary" @click="emit('parse')">解析</button>
      <span v-if="error" class="error">{{ error }}</span>
    </div>
  </div>
</template>