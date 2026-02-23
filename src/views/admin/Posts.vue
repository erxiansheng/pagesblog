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
      <div v-for="(post, index) in posts" :key="post.id" class="post-item"
        draggable="true"
        @dragstart="onDragStart(index, $event)"
        @dragover.prevent="onDragOver(index, $event)"
        @dragenter.prevent
        @drop="onDrop(index)"
        @dragend="onDragEnd"
        :class="{ dragging: dragIndex === index, 'drag-over': dragOverIndex === index && dragIndex !== index }">
        <div class="drag-handle" title="拖拽排序">⠿</div>
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
          <button @click="movePost(index, -1)" :disabled="index === 0" class="btn-sm btn-move" title="上移">↑</button>
          <button @click="movePost(index, 1)" :disabled="index === posts.length - 1" class="btn-sm btn-move" title="下移">↓</button>
          <router-link :to="`/admin/edit/${post.id}`" class="btn-sm">编辑</router-link>
          <button @click="handleDelete(post.id, post.title)" class="btn-sm btn-danger">删除</button>
        </div>
      </div>
    </div>
    <div v-else class="empty">暂无文章，去写一篇吧</div>
    <!-- 分页 -->
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
const dragIndex = ref(-1)
const dragOverIndex = ref(-1)
const page = ref(1)
const total = ref(0)
const LIMIT = 10
const totalPages = computed(() => Math.ceil(total.value / LIMIT) || 1)

const formatDate = (ts) => ts ? new Date(ts).toLocaleDateString('zh-CN') : ''

async function load() {
  loading.value = true
  try {
    const data = await getAdminPosts(page.value, LIMIT, currentCategory.value)
    posts.value = data.posts || []
    total.value = data.total || 0
    sortChanged.value = false
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

function movePost(index, direction) {
  const target = index + direction
  if (target < 0 || target >= posts.value.length) return
  const arr = [...posts.value]
  ;[arr[index], arr[target]] = [arr[target], arr[index]]
  posts.value = arr
  sortChanged.value = true
}

function onDragStart(index, e) {
  dragIndex.value = index
  e.dataTransfer.effectAllowed = 'move'
}
function onDragOver(index) { dragOverIndex.value = index }
function onDrop(index) {
  if (dragIndex.value === -1 || dragIndex.value === index) return
  const arr = [...posts.value]
  const [moved] = arr.splice(dragIndex.value, 1)
  arr.splice(index, 0, moved)
  posts.value = arr
  sortChanged.value = true
  dragIndex.value = -1
  dragOverIndex.value = -1
}
function onDragEnd() { dragIndex.value = -1; dragOverIndex.value = -1 }

async function saveSortOrder() {
  try {
    // 计算全局 sortOrder：(page-1)*limit + 当前页内索引
    const offset = (page.value - 1) * LIMIT
    const orders = posts.value.map((p, i) => ({ id: p.id, sortOrder: offset + i }))
    await reorderPosts(orders)
    sortChanged.value = false
    alert('排序已保存')
  } catch (e) { alert('保存失败: ' + e.message) }
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
.posts-list { display: flex; flex-direction: column; gap: 0.5rem; }
.post-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.2rem; background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-sm); transition: border-color 0.3s, opacity 0.2s, transform 0.2s;
}
.post-item:hover { border-color: var(--border-hover); }
.post-item.dragging { opacity: 0.4; }
.post-item.drag-over { border-color: var(--accent); transform: scale(1.01); }
.drag-handle {
  cursor: grab; font-size: 1.1rem; color: var(--text-muted); padding: 0 0.6rem 0 0;
  user-select: none; transition: color 0.2s; line-height: 1;
}
.drag-handle:hover { color: var(--accent); }
.post-info { flex: 1; min-width: 0; }
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
.btn-sm:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-sm:disabled:hover { border-color: var(--border); color: var(--text-dim); }
.btn-move { min-width: 2rem; text-align: center; }
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
  .post-item { flex-direction: column; align-items: flex-start; gap: 0.8rem; }
  .drag-handle { padding: 0 0 0.4rem 0; }
}
</style>
