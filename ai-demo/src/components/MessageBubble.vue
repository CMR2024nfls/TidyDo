<script setup>
import { computed } from 'vue';
import { renderMarkdown } from '../utils/markdown.js';

const props = defineProps({
  message: { type: Object, required: true }
});

const LABELS = { user: 'You', assistant: 'Assistant', system: 'System' };
const label = computed(() => LABELS[props.message.role] || props.message.role);
const html = computed(() => renderMarkdown(props.message.content));
</script>

<template>
  <div class="message" :class="message.role">
    <div class="role-label">{{ label }}</div>
    <div class="content" v-html="html"></div>
  </div>
</template>