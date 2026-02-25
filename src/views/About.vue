<template>
  <div class="about-page">
    <NavBar :siteName="siteName" :externalLinks="socialLinks" />
    <div class="container about">
      <h1>关于</h1>
      <div class="about-content markdown-body" v-html="renderedAbout"></div>
    </div>
    <Footer :siteName="siteName" :icp="icp" :copyright="copyright" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'
import NavBar from '../components/NavBar.vue'
import Footer from '../components/Footer.vue'
import { getSiteSettings } from '../api'

const about = ref('')
const siteName = ref('Blog')
const socialLinks = ref([])
const icp = ref('')
const copyright = ref('')
const renderedAbout = computed(() => marked(about.value || '这里还没有内容，站长还在偷懒...'))

onMounted(async () => {
  try {
    const data = await getSiteSettings()
    about.value = data.about || ''
    siteName.value = data.siteName || 'Blog'
    socialLinks.value = (data.socialLinks || []).filter(l => l.label && l.url)
    icp.value = data.icp || ''
    copyright.value = data.copyright || ''
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.about-page { min-height: 100vh; display: flex; flex-direction: column; padding-top: 4.5rem; }
.about { max-width: 54rem; padding-top: 3rem; padding-bottom: 4rem; flex: 1; overflow-x: hidden; }
.about h1 { font-size: 2rem; font-weight: 300; margin-bottom: 2rem; }
@media (max-width: 768px) {
  .about { width: 100%; max-width: 100%; }
  .about-content { max-width: calc(100vw - 2rem); }
}
</style>
