<script setup>
import { ref } from 'vue';

defineProps({
  task: { type: Object, required: true }
});
const emit = defineEmits(['update:title', 'update-step', 'add-step', 'remove-step', 'move-step']);

const dragIndex = ref(null);

function onDragStart(index, e) {
  dragIndex.value = index;
  e.target.classList.add('dragging');
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }
}

function onDragOver(e) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
}

function onDrop(index, e) {
  e.preventDefault();
  const from =
    dragIndex.value !== null
      ? dragIndex.value
      : Number(e.dataTransfer?.getData('text/plain'));
  if (from !== null && from !== undefined && from !== index) {
    emit('move-step', from, index);
  }
  dragIndex.value = null;
}

function onDragEnd(e) {
  dragIndex.value = null;
  e.target.classList.remove('dragging');
}
</script>

<template>
  <div class="task-editor">
    <div class="panel-title">2. 任务简述与步骤</div>

    <div class="title-row">
      <label class="label">任务简述</label>
      <input
        class="input title-input"
        :value="task.title"
        placeholder="任务简述"
        @input="emit('update:title', $event.target.value)"
      />
    </div>

    <div class="steps">
      <div
        v-for="(step, i) in task.steps"
        :key="i"
        class="step-row"
        draggable="true"
        @dragstart="onDragStart(i, $event)"
        @dragover="onDragOver"
        @drop="onDrop(i, $event)"
        @dragend="onDragEnd"
      >
        <span class="drag-handle" title="拖动排序">⠿</span>
        <span class="step-index">{{ i + 1 }}</span>
        <input
          class="input step-input"
          :value="step"
          placeholder="输入步骤内容"
          @input="emit('update-step', i, $event.target.value)"
        />
        <button
          class="btn icon danger"
          title="删除该步骤"
          @click="emit('remove-step', i)"
        >✕</button>
      </div>

      <button class="btn ghost add-step" @click="emit('add-step')">＋ 添加步骤</button>
    </div>
  </div>
</template>