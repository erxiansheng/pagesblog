<template>
  <div class="dashboard">
    <div class="dash-header">
      <h1>仪表盘</h1>
      <span class="dash-date">{{ todayStr }}</span>
    </div>
    <div class="stats-grid">
      <div class="stat-card" v-for="s in statCards" :key="s.label">
        <div class="stat-icon-wrap" :style="{ background: s.bg }">
          <span class="stat-icon-inner" v-html="s.icon"></span>
        </div>
        <div class="stat-info">
          <span class="stat-num">{{ s.value }}</span>
          <span class="stat-label">{{ s.label }}</span>
        </div>
      </div>
    </div>
    <div class="quick-section">
      <h3>快捷操作</h3>
      <div class="quick-grid">
        <router-link to="/admin/edit" class="quick-card">
          <span class="quick-icon">✏️</span>
          <span>写新文章</span>
        </router-link>
        <router-link to="/admin/categories" class="quick-card">
          <span class="quick-icon">📁</span>
          <span>管理分类</span>
        </router-link>
        <router-link to="/admin/images" class="quick-card">
          <span class="quick-icon">🖼️</span>
          <span>图片管理</span>
        </router-link>
        <router-link to="/admin/settings" class="quick-card">
          <span class="quick-icon">⚙️</span>
          <span>站点设置</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getStats } from '../../api'
const stats = ref({})
const todayStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

const statCards = computed(() => [
  { label: '文章数', value: stats.value.posts || 0, icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/></svg>', bg: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))' },
  { label: '分类数', value: stats.value.categories || 0, icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>', bg: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' },
  { label: '图片数', value: stats.value.images || 0, icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg>', bg: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))' },
  { label: '评论数', value: stats.value.comments || 0, icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clip-rule="evenodd"/></svg>', bg: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.05))' },
  { label: '今日浏览', value: stats.value.todayViews || 0, icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>', bg: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))' },
  { label: '今日阅读', value: stats.value.todayReads || 0, icon: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg>', bg: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))' },
])

onMounted(async () => {
  try { stats.value = await getStats() } catch (e) { console.error(e) }
})
</script>

<style scoped>
.dashboard { }
.dash-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2rem; flex-wrap: wrap; gap: 0.5rem; }
.dash-header h1 { font-size: 1.6rem; font-weight: 600; letter-spacing: -0.02em; }
.dash-date { font-size: 0.78rem; color: var(--text-muted); }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2.5rem; }
.stat-card {
  display: flex; align-items: center; gap: 1rem; padding: 1.3rem 1.2rem;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px;
  transition: border-color 0.3s, transform 0.2s;
}
.stat-card:hover { border-color: var(--border-hover); transform: translateY(-2px); }
.stat-icon-wrap {
  width: 44px; height: 44px; border-radius: 12px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
}
.stat-icon-inner { width: 22px; height: 22px; display: flex; }
.stat-icon-inner :deep(svg) { width: 22px; height: 22px; color: var(--text-dim); }
.stat-info { display: flex; flex-direction: column; }
.stat-num { font-size: 1.6rem; font-weight: 600; line-height: 1.2; letter-spacing: -0.02em; }
.stat-label { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.15rem; }
.quick-section h3 { font-size: 1rem; font-weight: 500; margin-bottom: 1rem; }
.quick-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.8rem; }
.quick-card {
  display: flex; flex-direction: column; align-items: center; gap: 0.6rem;
  padding: 1.5rem 1rem; background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 14px; font-size: 0.82rem; color: var(--text-dim);
  transition: all 0.25s; cursor: pointer;
}
.quick-card:hover { border-color: var(--accent); color: var(--accent); transform: translateY(-2px); }
.quick-icon { font-size: 1.5rem; }
</style>
