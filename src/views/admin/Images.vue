<template>
  <div class="images-manage">
    <h1>图片管理</h1>
    <div class="filter-bar">
      <button :class="{ active: filter === 'all' }" @click="filter = 'all'">全部 ({{ images.length }})</button>
      <button :class="{ active: filter === 'unused' }" @click="filter = 'unused'">未引用 ({{ unusedCount }})</button>
      <button v-if="unusedCount > 0" @click="deleteAllUnused" class="danger-btn">删除所有未引用</button>
    </div>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!filtered.length" class="empty">暂无图片</div>
    <div v-else class="image-grid">
      <div class="image-card" v-for="img in filtered" :key="img.filename" :class="{ unused: !img.used }">
        <div class="image-preview">
          <img :src="img.url" :alt="img.filename" loading="lazy" />
        </div>
        <div class="image-info">
          <span class="image-name" :title="img.filename">{{ img.filename }}</span>
          <span class="image-status" :class="img.used ? 'used' : 'not-used'">{{ img.used ? '已引用' : '未引用' }}</span>
        </div>
        <button v-if="!img.used" @click="handleDelete(img)" :disabled="img.deleting" class="delete-btn">
          {{ img.deleting ? '删除中...' : '删除' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAdminImages, deleteImage } from '../../api'

const images = ref([])
const loading = ref(true)
const filter = ref('all')

const unusedCount = computed(() => images.value.filter(i => !i.used).length)
const filtered = computed(() => filter.value === 'unused' ? images.value.filter(i => !i.used) : images.value)

const load = async () => {
  try {
    const data = await getAdminImages()
    images.value = (data.images || []).map(i => ({ ...i, deleting: false }))
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const handleDelete = async (img) => {
  if (!confirm(`确定删除 ${img.filename}？`)) return
  img.deleting = true
  try {
    await deleteImage(img.filename)
    images.value = images.value.filter(i => i.filename !== img.filename)
  } catch (e) { alert(e.message); img.deleting = false }
}

const deleteAllUnused = async () => {
  const unused = images.value.filter(i => !i.used)
  if (!confirm(`确定删除 ${unused.length} 张未引用图片？`)) return
  for (const img of unused) {
    try {
      await deleteImage(img.filename)
      images.value = images.value.filter(i => i.filename !== img.filename)
    } catch (e) { console.error(e) }
  }
}

onMounted(load)
</script>

<style scoped>
.images-manage h1 { font-size: 1.5rem; font-weight: 500; margin-bottom: 1.5rem; }
.filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.filter-bar button { padding: 0.4rem 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.8rem; cursor: pointer; color: var(--text-dim); font-family: var(--font); transition: all 0.3s; }
.filter-bar button.active { border-color: var(--accent); color: var(--accent); }
.danger-btn { border-color: var(--danger) !important; color: var(--danger) !important; margin-left: auto; }
.danger-btn:hover { background: var(--danger) !important; color: #fff !important; }
.loading, .empty { text-align: center; padding: 3rem; color: var(--text-muted); }
.image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
.image-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
.image-card.unused { border-color: var(--danger); opacity: 0.8; }
.image-preview { height: 120px; overflow: hidden; background: var(--bg-input); }
.image-preview img { width: 100%; height: 100%; object-fit: cover; }
.image-info { padding: 0.6rem; display: flex; flex-direction: column; gap: 0.3rem; }
.image-name { font-size: 0.7rem; color: var(--text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.image-status { font-size: 0.65rem; padding: 0.1rem 0.4rem; border-radius: 4px; width: fit-content; }
.image-status.used { background: rgba(34,197,94,0.1); color: #22c55e; }
.image-status.not-used { background: rgba(239,68,68,0.1); color: var(--danger); }
.delete-btn { width: 100%; padding: 0.4rem; background: none; border: none; border-top: 1px solid var(--border); color: var(--danger); font-size: 0.75rem; cursor: pointer; font-family: var(--font); transition: background 0.3s; }
.delete-btn:hover { background: rgba(239,68,68,0.1); }
.delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>