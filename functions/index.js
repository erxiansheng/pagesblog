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

// 路由表：[pattern, handler]
// 顺序重要：更具体的路径放前面
const routes = [
  // 管理 API（带动态参数的放前面）
  [/^\/api\/admin\/posts\/([^/]+)$/, adminPostByIdHandler],
  [/^\/api\/admin\/categories\/([^/]+)$/, adminCategoryByNameHandler],
  [/^\/api\/admin\/login$/, adminLoginHandler],
  [/^\/api\/admin\/settings$/, adminSettingsHandler],
  [/^\/api\/admin\/posts$/, adminPostsHandler],
  [/^\/api\/admin\/categories$/, adminCategoriesHandler],
  [/^\/api\/admin\/comments$/, adminCommentsHandler],
  [/^\/api\/admin\/images$/, adminImagesHandler],
  [/^\/api\/admin\/upload$/, adminUploadHandler],
  [/^\/api\/admin\/stats$/, adminStatsHandler],
  [/^\/api\/admin\/backup$/, adminBackupHandler],
  [/^\/api\/admin\/navlinks$/, adminNavlinksHandler],

  // 公开 API（带动态参数的放前面）
  [/^\/api\/posts\/([^/]+)$/, postByIdHandler],
  [/^\/api\/posts$/, postsHandler],
  [/^\/api\/categories$/, categoriesHandler],
  [/^\/api\/settings$/, settingsHandler],
  [/^\/api\/navlinks$/, navlinksHandler],
  [/^\/api\/comments$/, commentsHandler],
  [/^\/api\/captcha$/, captchaHandler],

  // 文件服务
  [/^\/uploads\/([^/]+)$/, uploadsHandler],
]

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const pathname = url.pathname

    for (const [pattern, handler] of routes) {
      const match = pathname.match(pattern)
      if (match) {
        return handler.fetch(request, env)
      }
    }

    // 未匹配到任何路由，返回 404
    return new Response('Not Found', { status: 404 })
  }
}
