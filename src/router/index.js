import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('../views/Home.vue') },
  { path: '/post/:id', component: () => import('../views/Post.vue') },
  { path: '/category/:name', component: () => import('../views/Category.vue') },
  { path: '/about', component: () => import('../views/About.vue') },
  // Admin login is standalone (no Layout wrapper)
  { path: '/admin/login', component: () => import('../views/admin/Login.vue') },
  // Admin routes (require auth, wrapped in Layout)
  { path: '/admin', component: () => import('../views/admin/Layout.vue'), children: [
    { path: '', component: () => import('../views/admin/Dashboard.vue') },
    { path: 'posts', component: () => import('../views/admin/Posts.vue') },
    { path: 'edit/:id?', component: () => import('../views/admin/Editor.vue') },
    { path: 'categories', component: () => import('../views/admin/Categories.vue') },
    { path: 'navlinks', component: () => import('../views/admin/NavLinks.vue') },
    { path: 'comments', component: () => import('../views/admin/Comments.vue') },
    { path: 'images', component: () => import('../views/admin/Images.vue') },
    { path: 'settings', component: () => import('../views/admin/Settings.vue') },
  ]}
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// Auth guard for admin routes
router.beforeEach((to, from, next) => {
  if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
    const token = localStorage.getItem('blog_token')
    if (!token) return next('/admin/login')
  }
  next()
})

export default router
