<template>
  <div class="posts-manage">
    <div class="page-header">
      <h1>文章管理</h1>
      <div class="header-actions">
        <button v-if="sortChanged" class="btn-save" @click="saveSortOrder">保存排序</button>
        <router-link to="/admin/edit" class="btn-primary">+ 新文章</router-link>
      </div>
    </div>
    <div class="filter-bar">
      <div class="category-filter">
        <button :class="{ active: !currentCategory }" @click="setCategory('')">全部</button>
        <button v-for="cat in categories" :key="cat" :class="{ active: currentCategory === cat }" @click="setCategory(cat)">{{ cat }}</button>
      </div>
    </div>
    <Loading v-if="loading" />
    <div v-else-if="posts.length" class="posts-list">
      <div class="list-header">
        <span class="col-sort">序号</span>
        <span class="col-title">标题</span>
        <span class="col-actions">操作</span>
      </div>
      <div v-for="post in posts" :key="post.id" class="post-item">
        <div class="col-sort">
          <input type="number" class="sort-input" :value="getSortValue(post)"
            @change="onSortChange(post.id, $event)" title="序号越小越靠前，留空则排在最后" placeholder="-">
        </div>
        <div class="post-info">
          <h3>{{ post.title }}</h3>
          <div class="post-meta">
            <span v-if="post.category" class="tag">{{ post.category }}</span>
            <span class="date">{{ formatDate(post.createdAt) }}</span>
            <span :class="['status', post.published ? 'published' : 'draft']">
              {{ post.published ? '已发布' : '草稿' }}
            </span>
            <span v-if="post.showOnHome" class="status home-tag">首页</span>
          </div>
        </div>
        <div class="post-actions">
          <router-link :to="`/admin/edit/${post.id}`" class="btn-sm">编辑</router-link>
          <button @click="handleDelete(post.id, post.title)" class="btn-sm btn-danger">删除</button>
        </div>
      </div>
    </div>
    <div v-else class="empty">暂无文章，去写一篇吧</div>
    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="page <= 1" @click="goPage(page - 1)" class="page-btn">上一页</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="goPage(page + 1)" class="page-btn">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Loading from '../../components/Loading.vue'
import { getAdminPosts, deletePost, reorderPosts, getCategories } from '../../api'

const posts = ref([])
const categories = ref([])
const currentCategory = ref('')
const loading = ref(true)
const sortChanged = ref(false)
const page = ref(1)
const total = ref(0)
const LIMIT = 10
const totalPages = computed(() => Math.ceil(total.value / LIMIT) || 1)

// 存储用户修改过的序号 { postId: newSortOrder }
const pendingOrders = ref({})

const formatDate = (ts) => ts ? new Date(ts).toLocaleDateString('zh-CN') : ''

function getSortValue(post) {
  if (pendingOrders.value[post.id] !== undefined) return pendingOrders.value[post.id]
  if (typeof post.sortOrder === 'number') return post.sortOrder
  return ''
}

function onSortChange(postId, event) {
  const val = event.target.value.trim()
  if (val === '') {
    pendingOrders.value[postId] = null // 清除序号
  } else {
    pendingOrders.value[postId] = parseInt(val) || 0
  }
  sortChanged.value = true
}

async function saveSortOrder() {
  try {
    const orders = Object.entries(pendingOrders.value).map(([id, sortOrder]) => ({
      id,
      sortOrder: sortOrder === null ? null : sortOrder
    }))
    if (!orders.length) return
    await reorderPosts(orders)
    sortChanged.value = false
    pendingOrders.value = {}
    load() // 重新加载以反映新排序
  } catch (e) { alert('保存失败: ' + e.message) }
}

async function load() {
  loading.value = true
  try {
    const data = await getAdminPosts(page.value, LIMIT, currentCategory.value)
    posts.value = data.posts || []
    total.value = data.total || 0
    sortChanged.value = false
    pendingOrders.value = {}
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function setCategory(cat) {
  currentCategory.value = cat
  page.value = 1
  load()
}

function goPage(p) {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  load()
}

async function handleDelete(id, title) {
  if (!confirm(`确定删除「${title}」？`)) return
  try {
    await deletePost(id)
    posts.value = posts.value.filter(p => p.id !== id)
    total.value = Math.max(0, total.value - 1)
    if (!posts.value.length && page.value > 1) { page.value--; load() }
  } catch (e) { alert(e.message) }
}

onMounted(async () => {
  try {
    const catsData = await getCategories()
    categories.value = catsData.categories || []
  } catch (e) { console.error(e) }
  load()
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; }
.page-header h1 { font-size: 1.5rem; font-weight: 500; }
.header-actions { display: flex; gap: 0.8rem; align-items: center; }
.btn-primary {
  padding: 0.6rem 1.2rem; background: var(--accent); color: var(--bg);
  border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500; transition: background 0.3s;
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-save {
  padding: 0.6rem 1.2rem; background: var(--success, #2ecc71); color: #fff;
  border: none; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500;
  cursor: pointer; font-family: var(--font); transition: opacity 0.3s;
}
.btn-save:hover { opacity: 0.85; }
.filter-bar { margin-bottom: 1.2rem; }
.category-filter { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.category-filter button {
  background: var(--bg-input); border: 1px solid var(--border); color: var(--text-dim);
  padding: 0.35rem 0.9rem; border-radius: 20px; font-size: 0.75rem; cursor: pointer;
  transition: all 0.3s; font-family: var(--font);
}
.category-filter button:hover, .category-filter button.active {
  background: rgba(201,169,110,0.15); border-color: var(--accent); color: var(--accent); font-weight: 600;
}
.list-header {
  display: flex; align-items: center; padding: 0.5rem 1.2rem; font-size: 0.7rem;
  color: var(--text-muted); border-bottom: 1px solid var(--border); margin-bottom: 0.3rem;
}
.col-sort { width: 60px; flex-shrink: 0; text-align: center; }
.col-title { flex: 1; }
.col-actions { width: 120px; flex-shrink: 0; text-align: right; }
.posts-list { display: flex; flex-direction: column; gap: 0; }
.post-item {
  display: flex; align-items: center; padding: 0.8rem 1.2rem;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-sm); margin-bottom: 0.4rem; transition: border-color 0.3s;
}
.post-item:hover { border-color: var(--border-hover); }
.sort-input {
  width: 48px; padding: 0.3rem 0.2rem; text-align: center; font-size: 0.8rem;
  background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px;
  color: var(--text); font-family: var(--font); transition: border-color 0.3s;
  -moz-appearance: textfield;
}
.sort-input::-webkit-outer-spin-button,
.sort-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.sort-input:focus { outline: none; border-color: var(--accent); }
.post-info { flex: 1; min-width: 0; padding: 0 0.8rem; }
.post-info h3 { font-size: 0.95rem; font-weight: 500; margin-bottom: 0.4rem; }
.post-meta { display: flex; align-items: center; gap: 0.8rem; font-size: 0.7rem; }
.tag { color: var(--accent); background: rgba(201,169,110,0.1); padding: 0.1rem 0.5rem; border-radius: 10px; }
.date { color: var(--text-muted); }
.status { padding: 0.1rem 0.5rem; border-radius: 10px; font-size: 0.65rem; }
.status.published { color: var(--success); background: rgba(46,204,113,0.1); }
.status.draft { color: var(--text-muted); background: var(--bg-input); }
.status.home-tag { color: var(--accent); background: rgba(201,169,110,0.1); }
.post-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
.btn-sm {
  padding: 0.4rem 0.8rem; font-size: 0.75rem; border-radius: 6px;
  background: var(--bg-input); border: 1px solid var(--border); color: var(--text-dim);
  cursor: pointer; transition: all 0.3s; font-family: var(--font);
}
.btn-sm:hover { border-color: var(--accent); color: var(--accent); }
.btn-danger:hover { border-color: var(--danger); color: var(--danger); }
.empty { text-align: center; padding: 4rem 0; color: var(--text-muted); }
.pagination {
  display: flex; align-items: center; justify-content: center; gap: 1rem;
  margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);
}
.page-btn {
  padding: 0.4rem 1rem; background: var(--bg-input); border: 1px solid var(--border);
  color: var(--text-dim); border-radius: var(--radius-sm); font-size: 0.8rem;
  cursor: pointer; font-family: var(--font); transition: all 0.3s;
}
.page-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.page-info { font-size: 0.8rem; color: var(--text-muted); }
@media (max-width: 600px) {
  .post-item { flex-wrap: wrap; gap: 0.5rem; }
  .col-sort { width: 48px; }
  .col-actions, .list-header .col-actions { width: auto; }
  .list-header { display: none; }
}
</style>
