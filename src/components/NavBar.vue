<template>
  <nav class="navbar" ref="navbarRef">
    <router-link to="/" class="nav-logo">
      {{ siteName }}<span class="dot">.</span>
    </router-link>
    <div class="nav-right">
      <div class="nav-links">
        <router-link to="/">首页</router-link>
        <router-link to="/about">关于</router-link>
        <a v-for="link in externalLinks" :key="link.url" :href="link.url" target="_blank" rel="noopener">{{ link.label }}</a>
      </div>
      <ThemeToggle />
      <button class="nav-toggle" @click="menuOpen = !menuOpen" aria-label="菜单">
        <span :class="{ open: menuOpen }"></span>
      </button>
    </div>
    <Transition name="slide">
      <div v-if="menuOpen" class="nav-mobile" @click="menuOpen = false" :style="{ top: navbarHeight + 'px' }">
        <router-link to="/">首页</router-link>
        <router-link to="/about">关于</router-link>
        <ThemeToggle />
      </div>
    </Transition>
  </nav>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import ThemeToggle from './ThemeToggle.vue'
defineProps({ siteName: { type: String, default: 'Blog' }, externalLinks: { type: Array, default: () => [] } })
const menuOpen = ref(false)
const navbarRef = ref(null)
const navbarHeight = ref(65)

watch(menuOpen, async (val) => {
  if (val) {
    await nextTick()
    if (navbarRef.value) {
      navbarHeight.value = navbarRef.value.getBoundingClientRect().height
    }
  }
})
</script>

<style scoped>
.navbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.5rem 3rem; position: sticky; top: 0; z-index: 100;
  background: var(--nav-glass); backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border); transition: background 0.4s;
  padding-top: calc(1.5rem + env(safe-area-inset-top, 0px));
}
.nav-logo { font-size: 1.1rem; font-weight: 600; letter-spacing: 0.05em; }
.dot { color: var(--accent); }
.nav-right { display: flex; align-items: center; gap: 1.5rem; }
.nav-links { display: flex; gap: 2rem; }
.nav-links a {
  font-size: 0.8rem; letter-spacing: 0.08em; color: var(--text-dim);
  transition: color 0.3s; text-transform: uppercase;
}
.nav-links a:hover, .nav-links a.router-link-active { color: var(--text); }
.nav-toggle { display: none; background: none; border: none; cursor: pointer; width: 24px; height: 20px; position: relative; }
.nav-toggle span, .nav-toggle span::before, .nav-toggle span::after {
  display: block; width: 100%; height: 2px; background: var(--text); position: absolute;
  transition: 0.3s var(--ease);
}
.nav-toggle span { top: 9px; }
.nav-toggle span::before { content: ''; top: -7px; }
.nav-toggle span::after { content: ''; top: 7px; }
.nav-toggle span.open { background: transparent; }
.nav-toggle span.open::before { top: 0; transform: rotate(45deg); }
.nav-toggle span.open::after { top: 0; transform: rotate(-45deg); }
.nav-mobile {
  position: fixed; left: 0; right: 0;
  background: var(--nav-glass); backdrop-filter: blur(20px);
  display: flex; flex-direction: column; align-items: flex-start; gap: 0; z-index: 99;
  border-bottom: 1px solid var(--border);
  padding: 0.5rem 0;
}
.nav-mobile a { font-size: 1rem; color: var(--text-dim); transition: color 0.3s; padding: 0.75rem 1.5rem; width: 100%; }
.nav-mobile a:hover, .nav-mobile a.router-link-active { color: var(--text); background: var(--bg-card-hover); }
.slide-enter-active, .slide-leave-active { transition: opacity 0.3s, transform 0.3s; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-10px); }
@media (max-width: 768px) {
  .navbar { padding: 1rem 1.5rem; padding-top: calc(1rem + env(safe-area-inset-top, 0px)); }
  .nav-links { display: none; }
  .nav-toggle { display: block; }
}
</style>
