import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('../views/Home.vue'), meta: { title: '首页' } },
  { path: '/post/:id', component: () => import('../views/Post.vue'), meta: { title: '文章' } },
  { path: '/category/:name', component: () => import('../views/Category.vue'), meta: { title: '分类' } },
  { path: '/about', component: () => import('../views/About.vue'), meta: { title: '关于' } },
  // Admin login is standalone (no Layout wrapper)
  { path: '/admin/login', component: () => import('../views/admin/Login.vue'), meta: { title: '管理登录' } },
  // Admin routes (require auth, wrapped in Layout)
  { path: '/admin', component: () => import('../views/admin/Layout.vue'), children: [
    { path: '', component: () => import('../views/admin/Dashboard.vue'), meta: { title: '仪表盘' } },
    { path: 'posts', component: () => import('../views/admin/Posts.vue'), meta: { title: '文章管理' } },
    { path: 'edit/:id?', component: () => import('../views/admin/Editor.vue'), meta: { title: '编辑文章' } },
    { path: 'categories', component: () => import('../views/admin/Categories.vue'), meta: { title: '分类管理' } },
    { path: 'navlinks', component: () => import('../views/admin/NavLinks.vue'), meta: { title: '导航管理' } },
    { path: 'comments', component: () => import('../views/admin/Comments.vue'), meta: { title: '评论管理' } },
    { path: 'images', component: () => import('../views/admin/Images.vue'), meta: { title: '图片管理' } },
    { path: 'settings', component: () => import('../views/admin/Settings.vue'), meta: { title: '站点设置' } },
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

// Dynamic page title
let siteTitle = ''
router.afterEach((to) => {
  const pageTitle = to.meta?.title || ''
  if (siteTitle && pageTitle) {
    document.title = `${pageTitle} - ${siteTitle}`
  } else if (siteTitle) {
    document.title = siteTitle
  }
})

// Allow other modules to set the site title
export function setSiteTitle(title) {
  siteTitle = title
}

// Allow setting a custom page title (e.g., article title)
export function setPageTitle(title) {
  if (siteTitle && title) {
    document.title = `${title} - ${siteTitle}`
  } else if (title) {
    document.title = title
  }
}

export default router
