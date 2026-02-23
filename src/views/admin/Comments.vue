<template>
  <div class="comments-manage">
    <h1>评论管理</h1>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!comments.length" class="empty">暂无评论</div>
    <div v-else class="comment-list">
      <div class="comment-item" v-for="c in comments" :key="c.id">
        <div class="comment-head">
          <span class="comment-nick">{{ c.nickname }}</span>
          <span class="comment-post" :title="c.postId">文章: {{ postTitleMap[c.postId] || c.postId }}</span>
          <span class="comment-time">{{ formatDate(c.createdAt) }}</span>
        </div>
        <p class="comment-body">{{ c.content }}</p>
        <button @click="handleDelete(c)" class="delete-btn" :disabled="c.deleting">
          {{ c.deleting ? '删除中...' : '删除' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAdminComments, getAdminPosts, deleteComment } from '../../api'

const comments = ref([])
const postTitleMap = ref({})
const loading = ref(true)

const formatDate = (ts) => ts ? new Date(ts).toLocaleDateString('zh-CN') : ''

const load = async () => {
  try {
    const [commentsData, postsData] = await Promise.all([
      getAdminComments(),
      getAdminPosts(1, 9999)
    ])
    comments.value = (commentsData.comments || []).map(c => ({ ...c, deleting: false }))
    // Build postId -> title map
    const map = {}
    for (const p of (postsData.posts || [])) {
      map[p.id] = p.title
    }
    postTitleMap.value = map
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const handleDelete = async (c) => {
  if (!confirm('确定删除该评论？')) return
  c.deleting = true
  try {
    await deleteComment(c.id, c.postId)
    comments.value = comments.value.filter(x => x.id !== c.id)
  } catch (e) { alert(e.message); c.deleting = false }
}

onMounted(load)
</script>

<style scoped>
.comments-manage h1 { font-size: 1.5rem; font-weight: 500; margin-bottom: 2rem; }
.loading, .empty { text-align: center; padding: 3rem; color: var(--text-muted); }
.comment-item { padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 0.8rem; }
.comment-head { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
.comment-nick { font-weight: 600; font-size: 0.85rem; color: var(--accent); }
.comment-post { font-size: 0.75rem; color: var(--text-dim); background: var(--bg-input); padding: 0.15rem 0.6rem; border-radius: 4px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.comment-time { font-size: 0.7rem; color: var(--text-muted); margin-left: auto; }
.comment-body { font-size: 0.85rem; color: var(--text-dim); line-height: 1.5; margin-bottom: 0.8rem; }
.delete-btn { padding: 0.3rem 0.8rem; background: none; border: 1px solid var(--danger); color: var(--danger); border-radius: var(--radius-sm); font-size: 0.75rem; cursor: pointer; font-family: var(--font); transition: all 0.3s; }
.delete-btn:hover { background: var(--danger); color: #fff; }
.delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
