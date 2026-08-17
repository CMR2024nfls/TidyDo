<script setup>
import { ref } from 'vue';
import JsonInput from './components/JsonInput.vue';
import TaskEditor from './components/TaskEditor.vue';
import JsonOutput from './components/JsonOutput.vue';

const DEFAULT_JSON = `{
  "title": "开发一个登录功能",
  "steps": [
    "创建登录页面 UI",
    "实现账号密码校验接口",
    "接入 token 鉴权逻辑",
    "编写登录成功与失败提示",
    "补充单元测试并回归验证"
  ]
}`;

const rawInput = ref(DEFAULT_JSON);
const task = ref(null);
const original = ref(null);
const parseError = ref('');
const output = ref('');

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function parseJson() {
  try {
    const data = JSON.parse(rawInput.value);
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('顶层应为对象，且包含 title / steps 字段');
    }
    const title = typeof data.title === 'string' ? data.title : String(data.title ?? '');
    const steps = Array.isArray(data.steps) ? data.steps.map((s) => String(s)) : [];
    task.value = clone({ title, steps });
    original.value = clone({ title, steps });
    parseError.value = '';
    output.value = '';
  } catch (e) {
    parseError.value = `JSON 解析失败：${e.message}`;
    task.value = null;
    output.value = '';
  }
}

function resetAll() {
  if (!original.value) return;
  task.value = clone(original.value);
  output.value = '';
}

function go() {
  if (!task.value) {
    parseError.value = '请先解析 JSON 再点击 GO';
    return;
  }
  output.value = JSON.stringify(task.value, null, 2);
}

function updateTitle(v) {
  task.value.title = v;
}

function addStep() {
  task.value.steps.push('新步骤');
}

function updateStep(i, v) {
  task.value.steps[i] = v;
}

function removeStep(i) {
  task.value.steps.splice(i, 1);
}

function moveStep(from, to) {
  const steps = task.value.steps;
  if (from === to || from < 0 || to < 0 || from >= steps.length || to >= steps.length) return;
  const [item] = steps.splice(from, 1);
  steps.splice(to, 0, item);
}
</script>

<template>
  <div id="app">
    <header>
      <h1>TidyDo · JSON 任务解析 Demo</h1>
      <p>粘贴 JSON，解析出任务简述与步骤；支持编辑、增删、拖动排序，可一键复原。</p>
    </header>

    <div class="layout">
      <section class="panel">
        <JsonInput v-model="rawInput" :error="parseError" @parse="parseJson" />
      </section>

      <section class="panel">
        <TaskEditor
          v-if="task"
          :task="task"
          @update:title="updateTitle"
          @update-step="updateStep"
          @add-step="addStep"
          @remove-step="removeStep"
          @move-step="moveStep"
        />
        <div v-else class="empty">暂无任务，请在左侧输入 JSON 并点击「解析」</div>
      </section>
    </div>

    <section class="panel actions">
      <button class="btn danger" :disabled="!task" @click="resetAll">复原</button>
      <button class="btn primary" @click="go">GO</button>
    </section>

    <section v-if="output" class="panel">
      <JsonOutput :json="output" />
    </section>
  </div>
</template>