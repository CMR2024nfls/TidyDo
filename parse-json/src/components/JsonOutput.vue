<script setup>
import { ref } from 'vue';

defineProps({
  json: { type: String, default: '' }
});

const copied = ref(false);

async function copy() {
  try {
    await navigator.clipboard.writeText(props.json);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    copied.value = false;
  }
}
</script>

<template>
  <div class="json-output">
    <div class="panel-title">3. 输出 JSON</div>
    <pre class="output-area">{{ json }}</pre>
    <div class="row">
      <button class="btn primary" @click="copy">{{ copied ? '已复制' : '复制' }}</button>
    </div>
  </div>
</template>