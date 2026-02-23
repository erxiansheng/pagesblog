// 阿里云 ESA Pages 统一入口
// 所有 /api/* 和 /uploads/* 请求由此分发到对应 handler

import postsHandler from './api/posts.js'
import postByIdHandler from './api/posts/[id].js'
import categoriesHandler from './api/categories.js'
import settingsHandler from './api/settings.js'
import navlinksHandler from './api/navlinks.js'
import commentsHandler from './api/comments.js'
import captchaHandler from './api/captcha.js'

import adminLoginHandler from './api/admin/login.js'
import adminSettingsHandler from './api/admin/settings.js'
import adminPostsHandler from './api/admin/posts.js'
import adminPostByIdHandler from './api/admin/posts/[id].js'
import adminCategoriesHandler from './api/admin/categories.js'
import adminCategoryByNameHandler from './api/admin/categories/[name].js'
import adminCommentsHandler from './api/admin/comments.js'
import adminImagesHandler from './api/admin/images.js'
import adminUploadHandler from './api/admin/upload.js'
import adminStatsHandler from './api/admin/stats.js'
import adminBackupHandler from './api/admin/backup.js'
import adminNavlinksHandler from './api/admin/navlinks.js'

import uploadsHandler from './uploads/[filename].js'

// 路由表：路径前缀精确匹配
const exactRoutes = {
  '/api/posts': postsHandler,
  '/api/categories': categoriesHandler,
  '/api/settings': settingsHandler,
  '/api/navlinks': navlinksHandler,
  '/api/comments': commentsHandler,
  '/api/captcha': captchaHandler,
  '/api/admin/login': adminLoginHandler,
  '/api/admin/settings': adminSettingsHandler,
  '/api/admin/posts': adminPostsHandler,
  '/api/admin/categories': adminCategoriesHandler,
  '/api/admin/comments': adminCommentsHandler,
  '/api/admin/images': adminImagesHandler,
  '/api/admin/upload': adminUploadHandler,
  '/api/admin/stats': adminStatsHandler,
  '/api/admin/backup': adminBackupHandler,
  '/api/admin/navlinks': adminNavlinksHandler,
}

// 动态路由：[pattern, handler]
const dynamicRoutes = [
  [/^\/api\/admin\/posts\/([^/]+)$/, adminPostByIdHandler],
  [/^\/api\/admin\/categories\/([^/]+)$/, adminCategoryByNameHandler],
  [/^\/api\/posts\/([^/]+)$/, postByIdHandler],
  [/^\/uploads\/([^/]+)$/, uploadsHandler],
]

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    // 去掉末尾斜杠
    const pathname = url.pathname.replace(/\/$/, '') || '/'

    // 1. 精确匹配
    const exactHandler = exactRoutes[pathname]
    if (exactHandler) {
      return exactHandler.fetch(request, env)
    }

    // 2. 动态路由匹配
    for (const [pattern, handler] of dynamicRoutes) {
      if (pattern.test(pathname)) {
        return handler.fetch(request, env)
      }
    }

    // 3. 非 API/uploads 路径，不处理（交给静态资源）
    if (!pathname.startsWith('/api/') && !pathname.startsWith('/uploads/')) {
      return new Response(null, { status: 404 })
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
