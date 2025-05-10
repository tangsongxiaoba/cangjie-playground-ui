<template>
  <n-config-provider :theme="theme" :hljs="hljs" style="height: 100%;">
    <n-message-provider>
      <MainLayout />
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, provide } from 'vue';
import { darkTheme } from 'naive-ui';
import hljs from 'highlight.js/lib/core'
import cangjie from './lib/highlight/cangjie.ts'

hljs.registerLanguage('cangjie', cangjie)

import MainLayout from './MainLayout.vue';

const isDarkMode = ref(false);
const theme = computed(() => (isDarkMode.value ? darkTheme : null));

watch(isDarkMode, (newValue) => {
  localStorage.setItem('cangjie-dark-mode', newValue.toString());
  if (newValue) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
});

onMounted(() => {
  const savedDarkMode = localStorage.getItem('cangjie-dark-mode');
  if (savedDarkMode) {
    isDarkMode.value = savedDarkMode === 'true';
  } else {
    // 如果 localStorage 没有记录，则根据系统偏好设置
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDarkMode.value = prefersDark;
  }
  if (isDarkMode.value) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
});

provide('isDarkMode', isDarkMode);
</script>