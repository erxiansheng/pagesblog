<template>
  <div class="category-page">
    <NavBar :siteName="siteName" :externalLinks="socialLinks" />
    <div class="container cat-content" style="padding-top: 2rem;">
      <h2 class="cat-title">分类: {{ $route.params.name }}</h2>
      <Loading v-if="loading" />
      <div v-else-if="posts.length" class="posts-grid">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
      </div>
      <div v-else class="empty">该分类暂无文章</div>
    </div>
    <Footer :siteName="siteName" :icp="icp" :copyright="copyright" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import PostCard from '../components/PostCard.vue'
import Footer from '../components/Footer.vue'
import Loading from '../components/Loading.vue'
import { getPostsByCategory, getSiteSettings } from '../api'
import { setPageTitle } from '../router'

const route = useRoute()
const posts = ref([])
const loading = ref(true)
const siteName = ref('Blog')
const socialLinks = ref([])
const icp = ref('')
const copyright = ref('')

async function load() {
  loading.value = true
  try {
    const data = await getPostsByCategory(route.params.name)
    posts.value = data.posts || []
    setPageTitle(`分类: ${route.params.name}`)
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(async () => {
  load()
  try {
    const data = await getSiteSettings()
    siteName.value = data.siteName || 'Blog'
    socialLinks.value = (data.socialLinks || []).filter(l => l.label && l.url)
    icp.value = data.icp || ''
    copyright.value = data.copyright || ''
  } catch (e) { /* ignore */ }
})
watch(() => route.params.name, load)
</script>

<style scoped>
.category-page { min-height: 100vh; display: flex; flex-direction: column; padding-top: 4.5rem; }
.cat-content { flex: 1; }
.cat-title { font-size: 1.5rem; font-weight: 500; margin-bottom: 2rem; }
.posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr)); gap: 1.5rem; }
.empty { text-align: center; padding: 4rem 0; color: var(--text-muted); }
</style>
