<template>
  <router-link :to="`/post/${post.id}`" class="post-card">
    <div v-if="post.cover" class="card-cover">
      <img :src="post.cover" :alt="post.title" loading="lazy">
    </div>
    <div class="card-body">
      <div class="card-meta">
        <span class="card-category" v-if="post.category">{{ post.category }}</span>
        <span class="card-date">{{ formatDate(post.createdAt) }}</span>
      </div>
      <h3 class="card-title">{{ post.title }}</h3>
      <p class="card-summary">{{ post.summary }}</p>
    </div>
    <span class="card-arrow">→</span>
  </router-link>
</template>

<script setup>
defineProps({ post: Object })
const formatDate = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.post-card {
  display: flex; flex-direction: column; background: var(--bg-surface);
  border: 1px solid var(--border); border-radius: var(--radius);
  overflow: hidden; transition: border-color 0.35s var(--ease), transform 0.35s var(--ease);
  position: relative; will-change: transform; transform: translateZ(0);
  height: 100%; aspect-ratio: 4/4; width: auto;
}
.post-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-4px) translateZ(0);
}
.card-cover { flex: 0 0 60%; overflow: hidden; }
.card-cover img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s var(--ease); will-change: transform; transform: translateZ(0); }
.post-card:hover .card-cover img { transform: scale(1.05) translateZ(0); }
.card-body { padding: 0.8rem 0.9rem; flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
.card-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.6rem; }
.card-category {
  color: var(--accent); background: rgba(201,169,110,0.1);
  padding: 0.1rem 0.5rem; border-radius: 20px; font-weight: 500;
}
.card-date { color: var(--text-muted); }
.card-title { font-size: 0.85rem; font-weight: 600; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-summary { font-size: 0.65rem; color: var(--text-dim); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-arrow {
  position: absolute; top: 0.6rem; right: 0.6rem; font-size: 0.8rem;
  color: var(--text-muted); transition: all 0.3s var(--ease);
}
.post-card:hover .card-arrow { color: var(--accent); transform: translateX(4px); }
</style>
