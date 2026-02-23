<template>
  <div class="admin-layout">
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <router-link to="/" class="sidebar-logo">
          <span class="logo-icon">✦</span>
          <span>Blog<span class="dot">.</span></span>
        </router-link>
        <span class="sidebar-badge">管理后台</span>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/admin" exact class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg></span>
          <span>仪表盘</span>
        </router-link>
        <router-link to="/admin/posts" class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/></svg></span>
          <span>文章管理</span>
        </router-link>
        <router-link to="/admin/edit" class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg></span>
          <span>写文章</span>
        </router-link>
        <router-link to="/admin/categories" class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg></span>
          <span>分类管理</span>
        </router-link>
        <router-link to="/admin/navlinks" class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"/></svg></span>
          <span>导航管理</span>
        </router-link>
        <router-link to="/admin/comments" class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/></svg></span>
          <span>评论管理</span>
        </router-link>
        <router-link to="/admin/images" class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg></span>
          <span>图片管理</span>
        </router-link>
        <router-link to="/admin/settings" class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg></span>
          <span>站点设置</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-theme"><ThemeToggle /></div>
        <button @click="logout" class="logout-btn">
          <svg viewBox="0 0 20 20" fill="currentColor" class="logout-icon"><path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm9 4.5a.5.5 0 00-1 0v2.793l-.854-.853a.5.5 0 00-.707.707l1.708 1.707a.5.5 0 00.707 0l1.707-1.707a.5.5 0 00-.707-.707l-.854.853V7.5z" clip-rule="evenodd"/></svg>
          退出登录
        </button>
      </div>
    </aside>
    <div class="admin-overlay" v-if="sidebarOpen" @click="sidebarOpen = false"></div>
    <main class="admin-main">
      <div class="admin-topbar">
        <button class="menu-btn" @click="sidebarOpen = !sidebarOpen" aria-label="菜单">
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
        </button>
        <span class="topbar-title">后台管理</span>
        <ThemeToggle style="margin-left: auto;" />
      </div>
      <div class="admin-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ThemeToggle from '../../components/ThemeToggle.vue'
const router = useRouter()
const sidebarOpen = ref(false)
const logout = () => { localStorage.removeItem('blog_token'); router.push('/admin/login') }
</script>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; background: var(--bg); }
.sidebar {
  width: 260px; display: flex; flex-direction: column; flex-shrink: 0;
  position: fixed; top: 0; bottom: 0; left: 0; z-index: 200;
  background: var(--bg-surface); border-right: 1px solid var(--border);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-header { padding: 1.8rem 1.5rem 1.2rem; border-bottom: 1px solid var(--border); }
.sidebar-logo { display: flex; align-items: center; gap: 0.6rem; font-size: 1.15rem; font-weight: 600; letter-spacing: 0.04em; }
.logo-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 10px;
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  color: #fff; font-size: 0.85rem;
}
.dot { color: var(--accent); }
.sidebar-badge { display: block; font-size: 0.58rem; color: var(--text-muted); margin-top: 0.4rem; letter-spacing: 0.15em; text-transform: uppercase; }
.sidebar-nav { flex: 1; padding: 0.8rem; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.nav-item {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0.9rem;
  font-size: 0.82rem; color: var(--text-dim); border-radius: 10px;
  transition: all 0.2s ease; font-weight: 450; letter-spacing: 0.01em;
}
.nav-item:hover { color: var(--text); background: var(--sidebar-hover); }
.nav-item.router-link-active { color: var(--accent); background: var(--sidebar-active); font-weight: 500; }
.nav-icon { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; flex-shrink: 0; }
.nav-icon svg { width: 18px; height: 18px; opacity: 0.65; }
.nav-item.router-link-active .nav-icon svg { opacity: 1; }
.sidebar-footer { padding: 1rem 1.2rem 1.5rem; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.6rem; }
.sidebar-theme { display: flex; justify-content: center; }
.logout-btn {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  width: 100%; padding: 0.55rem; background: var(--sidebar-hover); border: 1px solid transparent;
  color: var(--text-dim); border-radius: 10px; cursor: pointer; font-size: 0.78rem;
  transition: all 0.25s; font-family: var(--font); font-weight: 450;
}
.logout-icon { width: 16px; height: 16px; }
.logout-btn:hover { border-color: var(--danger); color: var(--danger); background: rgba(231,76,60,0.08); }
.admin-main { flex: 1; margin-left: 260px; min-height: 100vh; }
.admin-topbar {
  display: none; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border);
  background: var(--bg-surface); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 100;
}
.menu-btn {
  background: none; border: none; color: var(--text); cursor: pointer;
  display: flex; align-items: center; padding: 0.3rem; border-radius: 8px; transition: background 0.2s;
}
.menu-btn:hover { background: var(--sidebar-hover); }
.topbar-title { font-size: 0.85rem; color: var(--text-dim); margin-left: 0.8rem; font-weight: 500; }
.admin-content { padding: 2rem 2.5rem; max-width: 1200px; }
.admin-overlay { display: none; }
@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.open { transform: translateX(0); }
  .admin-main { margin-left: 0; }
  .admin-topbar { display: flex; align-items: center; }
  .admin-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 199; }
  .admin-content { padding: 1.2rem; }
}
</style>
