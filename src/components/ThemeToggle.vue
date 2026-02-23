<template>
  <button class="theme-toggle" @click="toggleTheme" :title="isDark ? '切换亮色' : '切换暗色'" aria-label="切换主题">
    <span class="toggle-icon">{{ isDark ? '☀️' : '🌙' }}</span>
  </button>
</template>

<script setup>
import { useTheme } from '../composables/useTheme'
const { isDark, toggleTheme } = useTheme()
</script>

<style scoped>
.theme-toggle {
  background: var(--bg-input); border: 1px solid var(--border); border-radius: 50%;
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.3s; font-size: 0.85rem;
}
.theme-toggle:hover { border-color: var(--accent); transform: rotate(20deg); }
</style>
