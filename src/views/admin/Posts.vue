<template>
  <div class="posts-manage">
    <div class="page-header">
      <h1>文章管理</h1>
      <router-link to="/admin/edit" class="btn-primary">+ 新文章</router-link>
    </div>
    <Loading v-if="loading" />
    <div v-else-if="posts.length" class="posts-list">
      <div v-for="post in posts" :key="post.id" class="post-item">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Loading from '../../components/Loading.vue'
import { getAdminPosts, deletePost } from '../../api'

const posts = ref([])
const loading = ref(true)

const formatDate = (ts) => ts ? new Date(ts).toLocaleDateString('zh-CN') : ''

async function load() {
  loading.value = true
  try {
    const data = await getAdminPosts()
    posts.value = data.posts || []
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function handleDelete(id, title) {
  if (!confirm(`确定删除「${title}」？`)) return
  try {
    await deletePost(id)
    posts.value = posts.value.filter(p => p.id !== id)
  } catch (e) { alert(e.message) }
}

onMounted(load)
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.page-header h1 { font-size: 1.5rem; font-weight: 500; }
.btn-primary {
  padding: 0.6rem 1.2rem; background: var(--accent); color: var(--bg);
  border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500; transition: background 0.3s;
}
.btn-primary:hover { background: var(--accent-hover); }
.posts-list { display: flex; flex-direction: column; gap: 0.5rem; }
.post-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.2rem; background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-sm); transition: border-color 0.3s;
}
.post-item:hover { border-color: var(--border-hover); }
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
@media (max-width: 600px) {
  .post-item { flex-direction: column; align-items: flex-start; gap: 0.8rem; }
}
</style>
