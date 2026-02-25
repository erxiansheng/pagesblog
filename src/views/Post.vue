<template>
  <div class="post-page">
    <NavBar :siteName="siteName" :externalLinks="socialLinks" />
    <Loading v-if="loading" />
    <article v-else-if="post" class="container article">
      <header class="article-header">
        <div class="article-meta">
          <router-link v-if="post.category" :to="`/category/${post.category}`" class="article-cat">{{ post.category }}</router-link>
          <span class="article-date">{{ formatDate(post.createdAt) }}</span>
          <span class="article-views">👁 {{ post.views || 0 }} 次浏览</span>
        </div>
        <h1>{{ post.title }}</h1>
        <p v-if="post.summary" class="article-summary">{{ post.summary }}</p>
      </header>
      <div v-if="post.cover" class="article-cover" @click="lightboxSrc = post.cover">
        <img :src="post.cover" :alt="post.title">
      </div>
      <div class="article-content markdown-body" v-html="renderedContent" @click="onContentClick"></div>

      <!-- Comments Section -->
      <section class="comments-section" v-if="post.commentsEnabled !== false">
        <h3 class="comments-title">💬 评论 ({{ post.comments?.length || 0 }})</h3>
        <div class="comment-list" v-if="post.comments?.length">
          <div class="comment-item" v-for="c in post.comments" :key="c.id">
            <div class="comment-head">
              <span class="comment-nick">{{ c.nickname }}</span>
              <span class="comment-time">{{ formatDate(c.createdAt) }}</span>
            </div>
            <p class="comment-body">{{ c.content }}</p>
          </div>
        </div>
        <div v-else class="no-comments">暂无评论，来说两句吧~</div>

        <div class="comment-form">
          <h4>发表评论</h4>
          <div class="form-row">
            <input v-model="commentForm.nickname" placeholder="昵称" maxlength="30" class="form-input" />
          </div>
          <div class="form-row">
            <textarea v-model="commentForm.content" placeholder="说点什么..." maxlength="500" rows="3" class="form-input"></textarea>
          </div>
          <div class="form-row captcha-row">
            <img v-if="captcha.image" :src="captcha.image" alt="验证码" class="captcha-img" @click="loadCaptcha" title="点击刷新" />
            <span v-else class="captcha-loading">加载中...</span>
            <input v-model="commentForm.captchaAnswer" placeholder="计算结果" class="form-input captcha-input" />
            <button @click="loadCaptcha" class="captcha-refresh" title="换一个">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          </div>
          <div v-if="commentError" class="comment-error">{{ commentError }}</div>
          <button @click="submitCommentHandler" :disabled="submitting" class="submit-btn">
            {{ submitting ? '提交中...' : '提交评论' }}
          </button>
        </div>
      </section>
      <section class="comments-section comments-closed" v-else>
        <p class="comments-closed-hint">该文章已关闭评论</p>
      </section>

      <div class="article-nav">
        <router-link to="/" class="back-link">← 返回首页</router-link>
      </div>
    </article>
    <div v-else class="container empty">文章不存在</div>
    <Footer :siteName="siteName" :icp="icp" :copyright="copyright" />
    <!-- Image Lightbox -->
    <Transition name="lightbox">
      <div v-if="lightboxSrc" class="lightbox-overlay" @click="lightboxSrc = ''">
        <img :src="lightboxSrc" class="lightbox-img" @click.stop>
        <button class="lightbox-close" @click="lightboxSrc = ''">✕</button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.min.css'
import NavBar from '../components/NavBar.vue'
import Footer from '../components/Footer.vue'
import Loading from '../components/Loading.vue'
import { getPost, getSiteSettings, getCaptcha, submitComment } from '../api'
import { useTheme } from '../composables/useTheme'
import { setPageTitle } from '../router'

marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value
    return hljs.highlightAuto(code).value
  }
})

// 视频链接解析
function parseVideoUrl(url) {
  if (!url || typeof url !== 'string') return null
  let m = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/)
  if (m) return { type: 'bilibili', id: m[1] }
  m = url.match(/b23\.tv\/([a-zA-Z0-9]+)/)
  if (m) return { type: 'bilibili-short', id: m[1] }
  m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (m) return { type: 'youtube', id: m[1] }
  return null
}

function renderVideoEmbed(video) {
  if (video.type === 'bilibili' || video.type === 'bilibili-short') {
    return `<div class="video-embed"><iframe src="https://player.bilibili.com/player.html?bvid=${video.id}&autoplay=0" allowfullscreen></iframe></div>`
  }
  if (video.type === 'youtube') {
    return `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${video.id}" allowfullscreen></iframe></div>`
  }
  return null
}

const route = useRoute()
const post = ref(null)
const loading = ref(true)
const siteName = ref('Blog')
const socialLinks = ref([])
const icp = ref('')
const copyright = ref('')
const { isDark } = useTheme()

const captcha = ref({})
const commentForm = ref({ nickname: '', content: '', captchaAnswer: '' })
const commentError = ref('')
const submitting = ref(false)

const renderedContent = computed(() => {
  if (!post.value) return ''
  let html = marked(post.value.content || '')
  // 后处理：将独立段落中的视频链接替换为嵌入播放器
  html = html.replace(/<p>\s*(https?:\/\/[^\s<]+(?:bilibili\.com\/video\/BV[a-zA-Z0-9]+|b23\.tv\/[a-zA-Z0-9]+|youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}|youtu\.be\/[a-zA-Z0-9_-]{11})[^\s<]*)\s*<\/p>/gi, (match, url) => {
    const video = parseVideoUrl(url)
    if (video) {
      const embed = renderVideoEmbed(video)
      if (embed) return embed
    }
    return match
  })
  // 也处理 <a> 链接形式的视频
  html = html.replace(/<a\s+href="(https?:\/\/[^"]*(?:bilibili\.com\/video\/BV[a-zA-Z0-9]+|b23\.tv\/[a-zA-Z0-9]+|youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}|youtu\.be\/[a-zA-Z0-9_-]{11})[^"]*)"[^>]*>[^<]*<\/a>/gi, (match, url) => {
    const video = parseVideoUrl(url)
    if (video) {
      const embed = renderVideoEmbed(video)
      if (embed) return embed
    }
    return match
  })
  return html
})
const formatDate = (ts) => ts ? new Date(ts).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

// Image lightbox
const lightboxSrc = ref('')
function onContentClick(e) {
  if (e.target.tagName === 'IMG' && e.target.closest('.markdown-body')) {
    lightboxSrc.value = e.target.src
  }
}
function onKeydown(e) {
  if (e.key === 'Escape' && lightboxSrc.value) lightboxSrc.value = ''
}
onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})

const loadCaptcha = async () => {
  try { captcha.value = await getCaptcha() } catch (e) { console.error(e) }
}

const submitCommentHandler = async () => {
  commentError.value = ''
  if (!commentForm.value.nickname.trim()) { commentError.value = '请输入昵称'; return }
  if (!commentForm.value.content.trim()) { commentError.value = '请输入评论内容'; return }
  if (!commentForm.value.captchaAnswer) { commentError.value = '请输入验证码答案'; return }
  submitting.value = true
  try {
    const res = await submitComment({
      postId: route.params.id,
      nickname: commentForm.value.nickname,
      content: commentForm.value.content,
      captchaId: captcha.value.id,
      captchaAnswer: commentForm.value.captchaAnswer
    })
    post.value.comments = [res.comment, ...(post.value.comments || [])]
    commentForm.value = { nickname: commentForm.value.nickname, content: '', captchaAnswer: '' }
    await loadCaptcha()
  } catch (e) { commentError.value = e.message || '提交失败' }
  finally { submitting.value = false }
}

onMounted(async () => {
  try {
    const [postData, settings] = await Promise.all([
      getPost(route.params.id),
      getSiteSettings(),
      loadCaptcha()
    ])
    post.value = postData.post
    if (post.value?.title) setPageTitle(post.value.title)
    siteName.value = settings.siteName || 'Blog'
    socialLinks.value = (settings.socialLinks || []).filter(l => l.label && l.url)
    icp.value = settings.icp || ''
    copyright.value = settings.copyright || ''
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>

<style scoped>
.post-page { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; padding-top: 4.5rem; }
.article { max-width: 54rem; padding-top: 2rem; padding-bottom: 4rem; flex: 1; overflow-x: hidden; }
.article-header { margin-bottom: 2rem; }
.article-meta { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.article-cat { font-size: 0.75rem; color: var(--accent); background: rgba(201,169,110,0.1); padding: 0.2rem 0.8rem; border-radius: 1.4rem; }
.article-date { font-size: 0.75rem; color: var(--text-muted); }
.article-views { font-size: 0.75rem; color: var(--text-muted); }
.article-header h1 { font-size: 2.2rem; font-weight: 600; line-height: 1.3; margin-bottom: 0.8rem; }
.article-summary { font-size: 1rem; color: var(--text-dim); line-height: 1.6; }.article-cover { margin-bottom: 2rem; border-radius: var(--radius); overflow: hidden; cursor: zoom-in; }
.article-cover img { width: 100%; transition: opacity 0.2s; }
.article-cover:hover img { opacity: 0.9; }
.article-nav { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border); }
.back-link { font-size: 0.85rem; color: var(--text-dim); transition: color 0.3s; }
.back-link:hover { color: var(--accent); }
.empty { text-align: center; padding: 6rem 0; color: var(--text-muted); flex: 1; }

/* Comments */
.comments-section { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border); }
.comments-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 1.5rem; }
.comment-item { padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 0.8rem; }
.comment-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.comment-nick { font-weight: 600; font-size: 0.85rem; color: var(--accent); }
.comment-time { font-size: 0.7rem; color: var(--text-muted); }
.comment-body { font-size: 0.85rem; line-height: 1.6; color: var(--text-dim); }
.no-comments { text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem; }

.comment-form { margin-top: 2rem; padding: 1.5rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius); }
.comment-form h4 { font-size: 0.95rem; font-weight: 600; margin-bottom: 1rem; }
.form-row { margin-bottom: 0.8rem; }
.form-input { width: 100%; padding: 0.6rem 0.8rem; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 0.85rem; font-family: var(--font); resize: vertical; box-sizing: border-box; }
.form-input:focus { outline: none; border-color: var(--accent); }
.captcha-row { display: flex; align-items: center; gap: 0.8rem; }
.captcha-img { height: 2.8rem; border-radius: var(--radius-sm); cursor: pointer; flex-shrink: 0; transition: opacity 0.2s; }
.captcha-img:hover { opacity: 0.8; }
.captcha-loading { font-size: 0.8rem; color: var(--text-muted); }
.captcha-input { width: 7rem; flex-shrink: 0; }
.captcha-refresh {
  background: none; border: 1px solid var(--border); border-radius: 50%;
  width: 2.4rem; height: 2.4rem; display: flex; align-items: center; justify-content: center;
  cursor: pointer; padding: 0; color: var(--text-dim); transition: all 0.3s var(--ease); flex-shrink: 0;
}
.captcha-refresh svg { width: 1.1rem; height: 1.1rem; }
.captcha-refresh:hover { color: var(--accent); border-color: var(--accent); transform: rotate(180deg); }
.comment-error { color: var(--danger); font-size: 0.8rem; margin-bottom: 0.5rem; }
.submit-btn { padding: 0.6rem 1.5rem; background: var(--accent); color: #000; border: none; border-radius: var(--radius-sm); font-size: 0.85rem; cursor: pointer; font-family: var(--font); transition: opacity 0.3s; }
.submit-btn:hover { opacity: 0.85; }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.comments-closed-hint { text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem; }

/* Lightbox */
.lightbox-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
.lightbox-img { max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 0.55rem; cursor: default; }
.lightbox-close { position: fixed; top: 1.5rem; right: 1.5rem; width: 2.5rem; height: 2.5rem; border-radius: 50%; background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.lightbox-close:hover { background: rgba(255,255,255,0.3); }
.lightbox-enter-active, .lightbox-leave-active { transition: opacity 0.25s; }
.lightbox-enter-from, .lightbox-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .post-page { padding-top: 3.5rem; }
  .article { padding-top: 1.2rem; padding-bottom: 2rem; width: 100%; max-width: 100%; }
  .article-meta { gap: 0.6rem; }
  .comment-form { padding: 1rem; }
  .captcha-row { flex-wrap: wrap; }
  .article-content { width: 100%; max-width: calc(100vw - 2rem); }
}
</style>

<style>
/* markdown-body 样式已移至 global.css */
</style>