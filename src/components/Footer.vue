<template>
  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-left">
        <span class="footer-copy">{{ copyright || `© ${year} ${siteName}. Powered by EdgeOne Pages` }}</span>
        <a v-if="icp" class="footer-icp" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">{{ icp }}</a>
      </div>
      <router-link to="/admin/login" class="footer-admin">管理</router-link>
    </div>
  </footer>
</template>

<script setup>
defineProps({
  siteName: { type: String, default: 'Blog' },
  icp: { type: String, default: '' },
  copyright: { type: String, default: '' }
})
const year = new Date().getFullYear()
</script>

<style scoped>
.footer { border-top: 1px solid var(--border); padding: 2rem 0; margin-top: auto; }
.footer-inner { display: flex; justify-content: space-between; align-items: center; }
.footer-left { display: flex; flex-direction: row; align-items: center; gap: 0.6rem; }
.footer-copy { font-size: 0.75rem; color: var(--text-muted); }
.footer-icp { font-size: 0.7rem; color: var(--text-muted); transition: color 0.3s; }
.footer-icp:hover { color: var(--text-dim); }
.footer-admin { font-size: 0.7rem; color: var(--text-muted); transition: color 0.3s; }
.footer-admin:hover { color: var(--text-dim); }
</style>
