import { ref, watch } from 'vue'

const isDark = ref(true)

// Init from localStorage or system preference (default: dark)
function initTheme() {
  const saved = localStorage.getItem('blog_theme')
  if (saved) {
    isDark.value = saved === 'dark'
  } else {
    isDark.value = true
  }
  applyTheme()
}

function applyTheme() {
  document.documentElement.classList.toggle('light', !isDark.value)
}

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('blog_theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

// Auto-apply on change
watch(isDark, applyTheme)

export function useTheme() {
  return { isDark, toggleTheme, initTheme }
}
