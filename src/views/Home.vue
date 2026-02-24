<template>
  <div class="home-page">
    <ThreeScene :modelUrl="modelUrl" :animated="modelAnimated" :modelScale="modelScale" :modelPosX="modelPosX" :modelPosY="modelPosY" :modelZoom="modelZoom" :models="sceneModels" @progress="onProgress" @loaded="onLoaded" v-if="settingsLoaded" />
    <div class="loader" :class="{ hidden: loaded }">
      <div class="loader-inner">
        <div class="loader-logo">{{ settings.siteName || 'Blog' }}<span class="loader-dot">.</span></div>
        <div class="loader-bar-wrap"><div class="loader-bar" :style="{ width: progress + '%' }"></div></div>
        <div class="loader-meta">
          <span class="loader-hint">正在加载资源</span>
          <span class="loader-text">{{ progress }}%</span>
        </div>
      </div>
    </div>
    <div class="page-layer">
      <nav class="nav">
        <div class="nav-logo">{{ settings.siteName || 'Blog' }}<span class="dot">.</span></div>
        <div class="nav-right">
          <div class="nav-links">
            <router-link to="/">首页</router-link>
            <router-link to="/about">关于</router-link>
            <a v-for="link in socialLinks" :key="link.url" :href="link.url" target="_blank" rel="noopener">{{ link.label }}</a>
          </div>
          <ThemeToggle />
        </div>
      </nav>
      <div class="main-body">
        <div class="hero-area">
          <div class="hero-top">
            <div class="hero-eyebrow">
              <div class="line"></div>
              <span>{{ settings.subtitle || '个人博客' }}</span>
            </div>
            <h1 class="hero-title">
              <span class="title-line" v-for="(word, i) in heroWords" :key="i">
                <span class="title-word">{{ word }}</span>
              </span>
            </h1>
          </div>
          <div class="cards-layer" @mousemove="onCardMouseMove" @mouseleave="resetCards" ref="cardsLayerRef">
            <router-link v-for="(post, i) in homePosts" :key="'p'+post.id"
              :to="`/post/${post.id}`" class="card" :ref="el => cardEls.push(el)">
              <div class="card-thumb" v-if="post.cover"><img :src="post.cover" :alt="post.title" loading="lazy"></div>
              <div class="card-content">
                <span class="card-num">{{ String(i + 1).padStart(2, '0') }}</span>
                <h3>{{ post.title }}</h3>
                <p>{{ post.summary }}</p>
              </div>
              <span class="card-arrow">↗</span>
            </router-link>
          </div>
          <div class="hero-bottom">
            <p class="hero-desc">{{ settings.description || '构建有意义的数字体验' }}</p>
            <button v-if="homePosts.length" class="more-btn" @click="showAllArticles = true">
              <span>查看全部文章</span>
              <span class="more-icon">↓</span>
            </button>
          </div>
        </div>
        <!-- Right side nav links dock -->
        <div class="nav-dock" v-if="navLinks.length">
          <div class="nav-dock-header">{{ settings.navDockTitle || '作品集导航' }}</div>
          <div class="nav-dock-list" @mousemove="onNavDockMouseMove" @mouseleave="resetNavDock" ref="navDockListRef">
            <a v-for="(link, i) in navLinks" :key="'n'+i"
              :href="link.url" :target="link.external ? '_blank' : '_self'" rel="noopener"
              class="nav-card" :ref="el => { if (el) navCardEls[i] = el }">
              <div class="nav-card-thumb" v-if="link.image"><img :src="link.image" :alt="link.name" loading="lazy"></div>
              <div class="nav-card-content">
                <span class="nav-card-tag">{{ link.name }}</span>
                <h3 v-if="link.desc">{{ link.desc }}</h3>
              </div>
              <span class="nav-card-arrow">↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
    <div class="home-icp" v-if="settings.icp">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">{{ settings.icp }}</a>
    </div>
    <Transition name="sheet">
      <div v-if="showAllArticles" class="sheet-overlay" @click.self="showAllArticles = false">
        <div class="sheet-panel">
          <div class="sheet-handle" @click="showAllArticles = false"><span></span></div>
          <div class="sheet-header">
            <div class="sheet-header-top">
              <h2>全部文章</h2>
              <div class="search-box">
                <span class="search-icon">🔍</span>
                <input v-model="searchQuery" class="search-input" placeholder="搜索文章..." @keydown.enter="doSearch">
                <button v-if="searchQuery" class="search-clear" @click="clearSearch">✕</button>
                <button class="search-btn" @click="doSearch">搜索</button>
              </div>
            </div>
            <div class="category-tabs">
              <button :class="{ active: !currentCategory }" @click="currentCategory = ''">全部</button>
              <button v-for="cat in categories" :key="cat" :class="{ active: currentCategory === cat }" @click="currentCategory = cat">{{ cat }}</button>
            </div>
          </div>
          <div class="sheet-body" ref="sheetBodyRef" @scroll="onSheetScroll" @mousedown="onSheetDragStart" @mousemove="onSheetDragMove" @mouseup="onSheetDragEnd" @mouseleave="onSheetDragEnd">
            <Transition name="fade" mode="out-in">
              <div v-if="sheetPosts.length" class="posts-grid" key="posts">
                <TransitionGroup name="card-fade" tag="div" class="posts-grid-inner">
                  <PostCard v-for="post in sheetPosts" :key="post.id" :post="post" />
                </TransitionGroup>
                <div v-if="sheetLoading" class="sheet-loading">加载中...</div>
                <div v-else-if="!sheetHasMore && sheetPosts.length" class="sheet-end">没有更多了</div>
              </div>
              <div v-else-if="sheetLoading" class="sheet-empty" key="loading">加载中...</div>
              <div v-else class="sheet-empty" key="empty">没有找到匹配的文章</div>
            </Transition>
          </div>
          <div class="sheet-footer">
            <div class="sheet-footer-left">
              <span class="sheet-copy">{{ settings.copyright || `© ${year} ${settings.siteName || 'Blog'}. Powered by lfc` }}</span>
              <a v-if="settings.icp" class="sheet-icp" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">{{ settings.icp }}</a>
            </div>
            <router-link to="/admin/login" class="sheet-admin">管理</router-link>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import gsap from 'gsap'
import ThreeScene from '../components/ThreeScene.vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import PostCard from '../components/PostCard.vue'
import { getPosts, getCategories, getSiteSettings, getNavLinks } from '../api'

const settings = ref({})
const navLinks = ref([])
const socialLinks = ref([])
const homePosts = ref([])
const categories = ref([])
const currentCategory = ref('')
const searchQuery = ref('')
const progress = ref(0)
const loaded = ref(false)
const showAllArticles = ref(false)
const settingsLoaded = ref(false)
const year = new Date().getFullYear()

// 弹窗分页状态
const sheetPosts = ref([])
const sheetPage = ref(1)
const sheetTotal = ref(0)
const sheetLoading = ref(false)
const sheetHasMore = computed(() => sheetPosts.value.length < sheetTotal.value)
const SHEET_LIMIT = 10

const heroWords = computed(() => {
  const name = settings.value.siteName || 'My Blog'
  return name.split(' ').length > 1 ? name.split(' ') : [name]
})
const modelUrl = computed(() => settings.value.modelUrl || '/mx_compressed.glb')
const modelAnimated = computed(() => !!settings.value.modelAnimated)
const modelScale = computed(() => settings.value.modelScale ?? 1)
const modelPosX = computed(() => settings.value.modelPosX ?? 0)
const modelPosY = computed(() => settings.value.modelPosY ?? 0)
const modelZoom = computed(() => settings.value.modelZoom ?? 0)
const sceneModels = computed(() => {
  if (settings.value.models && settings.value.models.length) return settings.value.models
  return []
})

async function loadSheetPosts(reset = false) {
  if (sheetLoading.value) return
  if (!reset && !sheetHasMore.value) return
  sheetLoading.value = true
  try {
    if (reset) { sheetPage.value = 1; sheetPosts.value = [] }
    const data = await getPosts(sheetPage.value, SHEET_LIMIT, {
      category: currentCategory.value || undefined,
      search: searchQuery.value.trim() || undefined
    })
    if (reset) {
      sheetPosts.value = data.posts || []
    } else {
      sheetPosts.value = [...sheetPosts.value, ...(data.posts || [])]
    }
    sheetTotal.value = data.total || 0
    sheetPage.value++
  } catch (e) { console.error(e) }
  finally { sheetLoading.value = false }
}

function doSearch() {
  loadSheetPosts(true)
}

function clearSearch() {
  searchQuery.value = ''
  loadSheetPosts(true)
}

watch(currentCategory, () => loadSheetPosts(true))
watch(showAllArticles, (val) => {
  if (val) {
    loadSheetPosts(true)
    nextTick(() => {
      if (sheetBodyRef.value) {
        sheetBodyRef.value.addEventListener('wheel', onSheetWheel, { passive: false })
      }
    })
  } else {
    if (sheetBodyRef.value) {
      sheetBodyRef.value.removeEventListener('wheel', onSheetWheel)
    }
  }
})

// Sheet body horizontal scroll, drag & infinite scroll
const sheetBodyRef = ref(null)
let isDragging = false, dragStartX = 0, dragScrollLeft = 0
let scrollRafId = null
let lastDragX = 0, lastDragTime = 0, dragVelocity = 0, momentumRafId = null

function onSheetWheel(e) {
  const el = sheetBodyRef.value
  if (!el) return
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    e.preventDefault()
    el.scrollLeft += e.deltaY
  }
}
function onSheetScroll() {
  if (scrollRafId) return
  scrollRafId = requestAnimationFrame(() => {
    scrollRafId = null
    const el = sheetBodyRef.value
    if (!el) return
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 200) {
      loadSheetPosts()
    }
  })
}
function onSheetDragStart(e) {
  const el = sheetBodyRef.value
  if (!el) return
  if (momentumRafId) { cancelAnimationFrame(momentumRafId); momentumRafId = null }
  isDragging = true
  dragStartX = e.pageX - el.offsetLeft
  dragScrollLeft = el.scrollLeft
  lastDragX = e.pageX
  lastDragTime = Date.now()
  dragVelocity = 0
  el.style.cursor = 'grabbing'
  el.style.userSelect = 'none'
}
function onSheetDragMove(e) {
  if (!isDragging) return
  const el = sheetBodyRef.value
  if (!el) return
  e.preventDefault()
  const x = e.pageX - el.offsetLeft
  el.scrollLeft = dragScrollLeft - (x - dragStartX)
  // 计算速度用于惯性
  const now = Date.now()
  const dt = now - lastDragTime
  if (dt > 0) {
    dragVelocity = (lastDragX - e.pageX) / dt
    lastDragX = e.pageX
    lastDragTime = now
  }
}
function onSheetDragEnd() {
  if (!isDragging) return
  isDragging = false
  const el = sheetBodyRef.value
  if (el) { el.style.cursor = ''; el.style.userSelect = '' }
  // 惯性滚动
  if (Math.abs(dragVelocity) > 0.3) {
    let v = dragVelocity * 16 // 转换为 px/frame
    function momentumStep() {
      if (!el || Math.abs(v) < 0.5) { momentumRafId = null; return }
      el.scrollLeft += v
      v *= 0.95 // 摩擦系数
      momentumRafId = requestAnimationFrame(momentumStep)
    }
    momentumRafId = requestAnimationFrame(momentumStep)
  }
}

function onProgress(pct) { progress.value = pct }
function onLoaded() {
  progress.value = 100
  setTimeout(() => { loaded.value = true; nextTick(runEntrance) }, 300)
}
function runEntrance() {
  const tl = gsap.timeline({ delay: 0.2 })
  tl.to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
    .to('.title-word', { y: 0, duration: 1, ease: 'power3.out', stagger: 0.12 }, '-=0.5')
    .fromTo('.card', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, clearProps: 'transform' }, '-=0.6')
    .to('.hero-desc', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
    .fromTo('.more-btn', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3')
    .fromTo('.nav-dock', { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
}

const cardEls = ref([])
const cardsLayerRef = ref(null)
const MAX_SCALE = 1.35, RANGE = 250
let mouseX = -9999, rafId = null

// Nav dock magnification
const navCardEls = ref([])
const navDockListRef = ref(null)
const NAV_MAX_SCALE = 1.3, NAV_RANGE = 120
let navMouseY = -9999, navRafId = null

function onNavDockMouseMove(e) {
  if ('ontouchstart' in window) return
  navMouseY = e.clientY
  if (!navRafId) navRafId = requestAnimationFrame(updateNavDock)
}
function updateNavDock() {
  navRafId = null
  navCardEls.value.forEach(el => {
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cy = rect.top + rect.height / 2
    const dist = Math.abs(navMouseY - cy)
    if (dist > NAV_RANGE) { el.style.transform = 'scale(1) translateX(0px)'; return }
    const ratio = 1 - dist / NAV_RANGE
    const curve = Math.cos((1 - ratio) * Math.PI * 0.5)
    const scale = 1 + (NAV_MAX_SCALE - 1) * curve
    const shift = curve * 10
    el.style.transform = `scale(${scale.toFixed(3)}) translateX(${(-shift).toFixed(1)}px)`
  })
}
function resetNavDock() {
  navMouseY = -9999
  if (navRafId) { cancelAnimationFrame(navRafId); navRafId = null }
  navCardEls.value.forEach(el => {
    if (el) el.style.transform = 'scale(1) translateX(0px)'
  })
}

function onCardMouseMove(e) {
  if ('ontouchstart' in window) return
  mouseX = e.clientX
  if (!rafId) rafId = requestAnimationFrame(updateCards)
}
function updateCards() {
  rafId = null
  cardEls.value.forEach(card => {
    const el = card?.$el || card
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const dist = Math.abs(mouseX - cx)
    if (dist > RANGE) { el.style.transform = 'scale(1) translateY(0px)'; return }
    const ratio = 1 - dist / RANGE
    const curve = Math.cos((1 - ratio) * Math.PI * 0.5)
    const scale = 1 + (MAX_SCALE - 1) * curve
    const lift = curve * 14
    el.style.transform = `scale(${scale.toFixed(3)}) translateY(${(-lift).toFixed(1)}px)`
  })
}
function resetCards() {
  mouseX = -9999
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  cardEls.value.forEach(card => {
    const el = card?.$el || card
    if (el) el.style.transform = 'scale(1) translateY(0px)'
  })
}

onMounted(async () => {
  document.body.style.overflow = 'hidden'
  try {
    const [postsData, catsData, settingsData, linksData] = await Promise.all([
      getPosts(1, 50, { showOnHome: true }), getCategories(), getSiteSettings(), getNavLinks()
    ])
    // 首页卡片：后端已过滤只返回 showOnHome 的文章
    homePosts.value = postsData.posts || []
    categories.value = catsData.categories || []
    settings.value = settingsData || {}
    socialLinks.value = (settingsData.socialLinks || []).filter(l => l.label && l.url)
    navLinks.value = (linksData.links || [])
    settingsLoaded.value = true
  } catch (e) { console.error(e) }
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.home-page { position: fixed; inset: 0; overflow: hidden; }
.loader { position: fixed; inset: 0; z-index: 9999; background: var(--bg); display: flex; align-items: center; justify-content: center; transition: opacity 0.6s var(--ease), visibility 0.6s; }
.loader.hidden { opacity: 0; visibility: hidden; pointer-events: none; }
.loader-inner { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
.loader-logo { font-size: 1.4rem; font-weight: 600; letter-spacing: 0.08em; }
.loader-dot { color: var(--accent); }
.loader-bar-wrap { width: 220px; height: 2px; background: var(--loader-bar-bg); border-radius: 2px; overflow: hidden; }
.loader-bar { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.3s var(--ease); }
.loader-meta { display: flex; justify-content: space-between; width: 220px; }
.loader-hint { font-size: 0.6rem; letter-spacing: 0.15em; color: var(--loader-hint); }
.loader-text { font-size: 0.6rem; letter-spacing: 0.2em; color: var(--text-dim); font-variant-numeric: tabular-nums; }
.page-layer { position: fixed; inset: 0; z-index: 10; display: flex; flex-direction: column; pointer-events: none; }
.page-layer > * { pointer-events: auto; }
.nav { display: flex; justify-content: space-between; align-items: center; padding: 1.2rem 2.5rem; flex-shrink: 0; }
.nav-logo { font-size: 0.95rem; font-weight: 600; letter-spacing: 0.08em; }
.dot { color: var(--accent); }
.nav-right { display: flex; align-items: center; gap: 1.5rem; }
.nav-links { display: flex; gap: 2rem; }
.nav-links a { font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); transition: color 0.3s; }
.nav-links a:hover { color: var(--text); }

.main-body { flex: 1; display: flex; min-height: 0; }
.hero-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.hero-top { padding: 0 3rem; flex-shrink: 0; }
.hero-eyebrow { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.8rem; opacity: 0; transform: translateY(20px); }
.hero-eyebrow .line { width: 30px; height: 1px; background: var(--text-dim); }
.hero-eyebrow span { font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-dim); }
.hero-title { font-size: clamp(2.5rem, 6vw, 5.5rem); font-weight: 300; line-height: 1.2; letter-spacing: -0.03em; }
.title-line { display: block; overflow: hidden; }
.title-word { display: inline-block; transform: translateY(110%); }

.cards-layer {
  flex: 1; display: flex; align-items: flex-end; justify-content: center;
  gap: 2vw; padding: 2rem 8% 1rem; pointer-events: none;
  overflow: hidden; scrollbar-width: none;
}
.cards-layer::-webkit-scrollbar { display: none; }
.card {
  pointer-events: auto; position: relative; width: 11.2vw; min-width: 100px; flex-shrink: 0;
  background: var(--bg-surface); border: 1px solid var(--border); border-radius: 14px;
  display: flex; flex-direction: column; overflow: hidden;
  transform-origin: bottom center; transition: background 0.3s, border-color 0.3s;
  will-change: transform;
}
.card:hover { background: var(--bg-surface); border-color: var(--border-hover); }
.card-thumb { width: 100%; aspect-ratio: 5/3; overflow: hidden; }
.card-thumb img { width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s; }
.card:hover .card-thumb img { opacity: 1; }
.card-content { padding: 0.6rem 0.8rem 0.8rem; display: flex; flex-direction: column; gap: 0.2rem; }
.card-num { font-size: 0.5rem; color: var(--accent); letter-spacing: 0.1em; font-weight: 500; }
.card h3 { font-size: 0.8rem; font-weight: 500; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card p { font-size: 0.58rem; color: var(--text-dim); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-arrow { position: absolute; top: 0.7rem; right: 0.7rem; font-size: 0.8rem; color: var(--text-muted); transition: color 0.3s, transform 0.3s var(--ease); }
.card:hover .card-arrow { color: var(--accent); transform: translate(2px, -2px); }

/* Right-side nav card dock */
.nav-dock {
  position: fixed; right: 1.2rem; top: 50%; transform: translateY(-50%) translateX(0);
  display: flex; flex-direction: column; z-index: 100;
  pointer-events: auto;
  border-radius: 14px;
  padding: 0.6rem;
  max-height: 80vh;
  opacity: 0;
  overflow: visible;
}
.nav-dock::before {
  content: ''; position: absolute; inset: 0; z-index: -1;
  background: rgba(14,14,20,0.35); backdrop-filter: blur(20px) saturate(1.4); -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid var(--border); border-radius: 14px;
  pointer-events: none;
}
:global(html.light) .nav-dock::before {
  background: rgba(245,243,239,0.4);
}
.nav-dock-header {
  font-size: 0.6rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text-dim); padding: 0.3rem 0.4rem 0.5rem; text-align: center;
  border-bottom: 1px solid var(--border); margin-bottom: 0.5rem;
}
.nav-dock-list {
  display: flex; flex-direction: column; gap: 0.7rem;
  overflow-y: auto; overflow-x: visible; scrollbar-width: none;
  margin: -2rem -0.5rem -2rem -4rem;
  padding: 2rem 0.5rem 2rem 4rem;
}
.nav-dock-list::-webkit-scrollbar { display: none; }
.nav-card {
  position: relative; width: 7.2vw; min-width: 65px; flex-shrink: 0;
  background: var(--bg-surface); border: 1px solid var(--border); border-radius: 10px;
  display: flex; flex-direction: column; overflow: hidden;
  transition: background 0.3s, border-color 0.3s;
  transform-origin: right center; will-change: transform;
  cursor: pointer;
}
.nav-card:hover { background: var(--bg-surface); border-color: var(--border-hover); }
.nav-card-thumb { width: 100%; aspect-ratio: 5/3; overflow: hidden; }
.nav-card-thumb img { width: 100%; height: 100%; object-fit: cover; opacity: 0.85; transition: opacity 0.3s; }
.nav-card:hover .nav-card-thumb img { opacity: 1; }
.nav-card-content { padding: 0.4rem 0.55rem 0.55rem; display: flex; flex-direction: column; gap: 0.15rem; }
.nav-card-tag { font-size: 0.6rem; color: var(--accent); letter-spacing: 0.06em; font-weight: 600; }
.nav-card-content h3 { font-size: 0.55rem; font-weight: 500; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: var(--text-dim); }
.nav-card-arrow { position: absolute; top: 0.45rem; right: 0.45rem; font-size: 0.55rem; color: var(--text-muted); transition: color 0.3s, transform 0.3s var(--ease); }
.nav-card:hover .nav-card-arrow { color: var(--accent); transform: translate(2px, -2px); }

.hero-bottom { padding: 0.6rem 3rem 1.2rem; flex-shrink: 0; display: flex; align-items: center; justify-content: center; gap: 2rem; }
.hero-desc { font-size: 0.75rem; color: var(--text-dim); letter-spacing: 0.15em; opacity: 0; transform: translateY(10px); }
.more-btn {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1.2rem; border-radius: 24px;
  background: rgba(201,169,110,0.12); border: 1px solid rgba(201,169,110,0.3);
  color: var(--accent); font-size: 0.75rem; font-weight: 500; letter-spacing: 0.06em;
  cursor: pointer; font-family: var(--font); transition: all 0.3s var(--ease); opacity: 0;
}
.more-btn:hover { background: rgba(201,169,110,0.22); border-color: var(--accent); transform: translateY(-2px); }
.more-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 50%; background: rgba(201,169,110,0.2);
  font-size: 0.65rem; animation: bounceDown 2s infinite;
}
@keyframes bounceDown { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(3px); } }

.sheet-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.15); display: flex; flex-direction: column; justify-content: flex-end; }
.sheet-panel {
  position: relative;
  border-top: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px 20px 0 0; height: 36vh; max-height: 36vh; display: flex; flex-direction: column;
  animation: sheetUp 0.4s var(--ease); isolation: isolate;
  overflow: hidden;
}
.sheet-panel::before {
  content: ''; position: absolute; inset: 0; z-index: -1;
  background: rgba(14,14,20,0.35); backdrop-filter: blur(32px) saturate(1.6);
  -webkit-backdrop-filter: blur(32px) saturate(1.6);
  border-radius: 20px 20px 0 0; pointer-events: none;
}
:global(html.light) .sheet-panel {
  border-top: 1px solid rgba(0,0,0,0.08);
}
:global(html.light) .sheet-panel::before {
  background: rgba(245,243,239,0.4);
}
@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.sheet-handle { display: flex; justify-content: center; padding: 0.5vh 0 0.3vh; cursor: pointer; flex-shrink: 0; }
.sheet-handle span { width: 36px; height: 4px; border-radius: 2px; background: var(--text-muted); }
.sheet-header { display: flex; flex-direction: column; padding: 0 2rem 0.6vh; gap: 0.5vh; flex-shrink: 0; }
.sheet-header-top { display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; }
.sheet-header h2 { font-size: clamp(0.9rem, 1.1vw, 1.2rem); font-weight: 500; white-space: nowrap; flex-shrink: 0; }
.search-box {
  display: flex; align-items: center; gap: 0.4rem;
  background: var(--bg-input); border: 1px solid var(--border); border-radius: 20px;
  padding: 0.3rem 0.7rem; transition: border-color 0.3s;
}
.search-box:focus-within { border-color: var(--accent); }
.search-icon { font-size: 0.7rem; opacity: 0.5; }
.search-input {
  background: transparent; border: none; outline: none; color: var(--text);
  font-size: clamp(0.6rem, 0.7vw, 0.75rem); font-family: var(--font); width: 120px;
}
.search-input::placeholder { color: var(--text-muted); }
.search-clear {
  background: none; border: none; color: var(--text-muted); cursor: pointer;
  font-size: 0.6rem; padding: 0; line-height: 1; transition: color 0.2s;
}
.search-clear:hover { color: var(--text); }
.search-btn {
  background: var(--accent); color: var(--bg); border: none; border-radius: 14px;
  padding: 0.2rem 0.6rem; font-size: 0.65rem; cursor: pointer; font-family: var(--font);
  font-weight: 500; transition: opacity 0.2s; white-space: nowrap;
}
.search-btn:hover { opacity: 0.8; }
.sheet-empty { text-align: center; color: var(--text-muted); font-size: 0.85rem; height: 100%; display: flex; align-items: center; justify-content: center; }
.sheet-loading, .sheet-end {
  display: flex; align-items: center; justify-content: center;
  min-width: 120px; flex-shrink: 0; color: var(--text-muted); font-size: 0.75rem;
  padding: 0 1rem;
}
/* 内容切换过渡 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
/* 卡片逐个出现 */
.card-fade-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.card-fade-enter-from { opacity: 0; transform: translateY(12px); }
.posts-grid-inner { display: flex; gap: 1rem; flex-wrap: nowrap; height: 100%; align-items: stretch; }
.posts-grid-inner > :deep(.post-card) { width: auto; height: 100%; 4/4; flex-shrink: 0; }
.category-tabs { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.category-tabs button {
  background: var(--bg-input); border: 1px solid var(--border); color: var(--text);
  padding: 0.2vh 0.6vw; border-radius: 20px; font-size: clamp(0.55rem, 0.65vw, 0.7rem); cursor: pointer;
  transition: all 0.3s; font-family: var(--font);
}
.category-tabs button:hover, .category-tabs button.active { background: rgba(201,169,110,0.2); border-color: var(--accent); color: #8b6c35; font-weight: 600; }
:global(html.light) .category-tabs button.active,
:global(html.light) .category-tabs button:hover { color: #7a5e2a; background: rgba(160,125,63,0.18); }
.sheet-body {
  flex: 1; overflow-x: auto; overflow-y: hidden; padding: 0.5vh 2rem 0.5vh;
  background: transparent; cursor: grab; scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  contain: layout style paint;
  min-height: 0;
}
.sheet-body::-webkit-scrollbar { display: none; }
.posts-grid { display: flex; gap: 1rem; flex-wrap: nowrap; padding-bottom: 0.3vh; align-items: stretch; will-change: transform; height: 100%; }
.posts-grid > * { flex-shrink: 0; }
.posts-grid-inner > * { height: 100%; flex-shrink: 0; }
.sheet-footer { display: flex; justify-content: space-between; align-items: center; padding: 0.5vh 2rem; border-top: 1px solid var(--border); flex-shrink: 0; background: transparent; border-radius: 0 0 0 0; }
.sheet-copy { font-size: clamp(0.55rem, 0.65vw, 0.7rem); color: var(--text-muted); }
.sheet-footer-left { display: flex; flex-direction: row; align-items: center; gap: 0.6rem; }
.sheet-icp { font-size: 0.65rem; color: var(--text-muted); transition: color 0.3s; }
.sheet-icp:hover { color: var(--text-dim); }
.sheet-admin { font-size: 0.65rem; color: var(--text-muted); transition: color 0.3s; }
.sheet-admin:hover { color: var(--text-dim); }
.home-icp { position: fixed; left: 2rem; bottom: 1rem; z-index: 20; pointer-events: auto; }
.home-icp a { font-size: 0.65rem; color: var(--text-muted); transition: color 0.3s; text-decoration: none; }
.home-icp a:hover { color: var(--text-dim); }
.sheet-enter-active { transition: opacity 0.3s; }
.sheet-enter-active .sheet-panel { animation: sheetUp 0.4s var(--ease); }
.sheet-leave-active { transition: opacity 0.3s; }
.sheet-leave-active .sheet-panel { animation: sheetDown 0.3s var(--ease) forwards; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
@keyframes sheetDown { from { transform: translateY(0); } to { transform: translateY(100%); } }

@media (max-width: 1024px) {
  .cards-layer { padding: 0.5rem 1.5rem; gap: 1rem; }
  .card { width: 14.4vw; }
  .nav-dock { right: 0.5rem; padding: 0.5rem; }
  .nav-card { width: 6.4vw; }
}
@media (max-width: 768px) {
  .nav { padding: 0.8rem 1.2rem; }
  .nav-links { gap: 1.2rem; }
  .nav-links a { font-size: 0.6rem; }
  .hero-top { padding: 0 1.2rem; }
  .hero-title { font-size: clamp(1.8rem, 8vw, 3rem); }
  .cards-layer { padding: 0.5rem 0.8rem; gap: 0.6rem; justify-content: flex-start; padding-right: 120px; }
  .card { width: 30vw; min-width: 110px; }
  .card-content { padding: 0.4rem 0.6rem 0.6rem; }
  .card h3 { font-size: 0.7rem; -webkit-line-clamp: 1; }
  .card p { font-size: 0.5rem; -webkit-line-clamp: 1; }
  .card-arrow { top: 0.4rem; right: 0.4rem; font-size: 0.65rem; }
  .hero-bottom { padding: 0.5rem 1.2rem 0.8rem; gap: 1rem; flex-wrap: wrap; }
  .hero-desc { font-size: 0.6rem; }
  .more-btn { font-size: 0.65rem; padding: 0.4rem 1rem; }
  .sheet-panel { height: 75vh; max-height: 75vh; }
  .sheet-body { overflow-x: auto; overflow-y: hidden; }
  .sheet-header { padding: 0 1.2rem 0.5vh; gap: 0.4vh; }
  .sheet-header-top { gap: 0.5rem; }
  .sheet-header h2 { font-size: 1rem; }
  .search-box { flex: -1; min-width: 0; }
  .search-input { width: 60px; flex: 1; min-width: 0; }
  .posts-grid-inner > :deep(.post-card) { aspect-ratio: 3/4; }
  .nav-dock { right: 0.3rem; padding: 0.4rem; border-radius: 10px; }
  .nav-dock-header { font-size: 0.5rem; padding: 0.2rem 0.3rem 0.4rem; }
  .nav-dock-list { gap: 0.3rem; }
  .nav-card { width: 19.2vw; min-width: 75px; }
  .nav-card-content { padding: 0.3rem 0.4rem 0.4rem; }
  .nav-card-tag { font-size: 0.45rem; }
  .nav-card-content h3 { font-size: 0.45rem; -webkit-line-clamp: 1; }
  .nav-card-arrow { font-size: 0.45rem; top: 0.3rem; right: 0.3rem; }
}
@media (max-width: 480px) {
  .nav { padding: 0.6rem 0.8rem; }
  .nav-logo { font-size: 0.85rem; }
  .nav-links { display: none; }
  .hero-top { padding: 0 0.8rem; }
  .hero-eyebrow { margin-bottom: 0.4rem; }
  .hero-title { font-size: 1.6rem; }
  .cards-layer { padding: 0.3rem 0.5rem; gap: 0.4rem; padding-right: 100px; }
  .card { width: 40vw; min-width: 95px; }
  .card-content { padding: 0.3rem 0.5rem 0.5rem; gap: 0.1rem; }
  .card-num { font-size: 0.4rem; }
  .card h3 { font-size: 0.6rem; }
  .card p { display: none; }
  .hero-bottom { padding: 0.4rem 0.8rem 0.6rem; flex-direction: column; gap: 0.4rem; }
  .sheet-panel { height: 35vh; max-height: 35vh; }
  .sheet-body { padding: 0 1rem 1rem; overflow-x: auto; overflow-y: hidden; }
  .sheet-header { padding: 0 0.8rem 0.5rem; gap: 0.4rem; }
  .sheet-header h2 { font-size: 0.95rem; }
  .sheet-footer { padding: 0.6rem 1rem; }
  .posts-grid-inner > :deep(.post-card) { aspect-ratio: 3/4; }
  .nav-dock { right: 0.2rem; padding: 0.3rem; border-radius: 8px; }
  .nav-dock-header { font-size: 0.4rem; padding: 0.15rem 0.2rem 0.3rem; margin-bottom: 0.3rem; }
  .nav-dock-list { gap: 0.25rem; }
  .nav-card { width: 21.3vw; min-width: 65px; }
  .nav-card-content h3 { display: none; }
}
</style>
