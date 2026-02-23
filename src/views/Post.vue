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
      <div v-if="post.cover" class="article-cover">
        <img :src="post.cover" :alt="post.title">
      </div>
      <div class="article-content markdown-body" v-html="renderedContent"></div>

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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.min.css'
import NavBar from '../components/NavBar.vue'
import Footer from '../components/Footer.vue'
import Loading from '../components/Loading.vue'
import { getPost, getSiteSettings, getCaptcha, submitComment } from '../api'
import { useTheme } from '../composables/useTheme'

marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value
    return hljs.highlightAuto(code).value
  }
})

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

const renderedContent = computed(() => post.value ? marked(post.value.content || '') : '')
const formatDate = (ts) => ts ? new Date(ts).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

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
    siteName.value = settings.siteName || 'Blog'
    socialLinks.value = (settings.socialLinks || []).filter(l => l.label && l.url)
    icp.value = settings.icp || ''
    copyright.value = settings.copyright || ''
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>

<style scoped>
.post-page { min-height: 100vh; display: flex; flex-direction: column; }
.article { max-width: 780px; padding-top: 2rem; padding-bottom: 4rem; flex: 1; }
.article-header { margin-bottom: 2rem; }
.article-meta { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.article-cat { font-size: 0.75rem; color: var(--accent); background: rgba(201,169,110,0.1); padding: 0.2rem 0.8rem; border-radius: 20px; }
.article-date { font-size: 0.75rem; color: var(--text-muted); }
.article-views { font-size: 0.75rem; color: var(--text-muted); }
.article-header h1 { font-size: 2.2rem; font-weight: 600; line-height: 1.3; margin-bottom: 0.8rem; }
.article-summary { font-size: 1rem; color: var(--text-dim); line-height: 1.6; }
.article-cover { margin-bottom: 2rem; border-radius: var(--radius); overflow: hidden; }
.article-cover img { width: 100%; }
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
.captcha-img { height: 40px; border-radius: var(--radius-sm); cursor: pointer; flex-shrink: 0; transition: opacity 0.2s; }
.captcha-img:hover { opacity: 0.8; }
.captcha-loading { font-size: 0.8rem; color: var(--text-muted); }
.captcha-input { width: 100px; flex-shrink: 0; }
.captcha-refresh {
  background: none; border: 1px solid var(--border); border-radius: 50%;
  width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; padding: 0; color: var(--text-dim); transition: all 0.3s var(--ease); flex-shrink: 0;
}
.captcha-refresh svg { width: 16px; height: 16px; }
.captcha-refresh:hover { color: var(--accent); border-color: var(--accent); transform: rotate(180deg); }
.comment-error { color: var(--danger); font-size: 0.8rem; margin-bottom: 0.5rem; }
.submit-btn { padding: 0.6rem 1.5rem; background: var(--accent); color: #000; border: none; border-radius: var(--radius-sm); font-size: 0.85rem; cursor: pointer; font-family: var(--font); transition: opacity 0.3s; }
.submit-btn:hover { opacity: 0.85; }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.comments-closed-hint { text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem; }
</style>

<style>
.markdown-body { font-size: 0.95rem; line-height: 1.8; color: var(--text); }
.markdown-body h1, .markdown-body h2, .markdown-body h3 { margin: 2rem 0 1rem; font-weight: 600; }
.markdown-body h2 { font-size: 1.5rem; }
.markdown-body h3 { font-size: 1.2rem; }
.markdown-body p { margin-bottom: 1.2rem; }
.markdown-body a { color: var(--accent); border-bottom: 1px solid transparent; transition: border-color 0.3s; }
.markdown-body a:hover { border-bottom-color: var(--accent); }
.markdown-body img { border-radius: var(--radius-sm); margin: 1.5rem 0; }
.markdown-body pre { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1.2rem; overflow-x: auto; margin: 1.5rem 0; }
.markdown-body code { font-size: 0.85em; font-family: 'Fira Code', monospace; }
.markdown-body :not(pre) > code { background: var(--bg-input); padding: 0.15em 0.4em; border-radius: 4px; }
html.light .markdown-body pre { background: #f6f8fa; border-color: #d0d7de; }
html.light .markdown-body pre code { color: #24292f; }
html.light .markdown-body :not(pre) > code { background: rgba(175,184,193,0.2); color: #24292f; }
html.light .hljs { background: #f6f8fa; color: #24292f; }
html.light .hljs-keyword { color: #cf222e; }
html.light .hljs-string { color: #0a3069; }
html.light .hljs-comment { color: #6e7781; }
html.light .hljs-function .hljs-title, html.light .hljs-title.function_ { color: #8250df; }
html.light .hljs-number { color: #0550ae; }
html.light .hljs-built_in { color: #0550ae; }
html.light .hljs-attr { color: #0550ae; }
html.light .hljs-selector-class { color: #0550ae; }
html.light .hljs-type { color: #953800; }
.markdown-body blockquote { border-left: 3px solid var(--accent); padding-left: 1rem; margin: 1.5rem 0; color: var(--text-dim); }
.markdown-body ul, .markdown-body ol { padding-left: 1.5rem; margin-bottom: 1.2rem; }
.markdown-body li { margin-bottom: 0.4rem; }
.markdown-body hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
.markdown-body table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
.markdown-body th, .markdown-body td { border: 1px solid var(--border); padding: 0.6rem 1rem; text-align: left; }
.markdown-body th { background: var(--bg-surface); font-weight: 600; }
</style>