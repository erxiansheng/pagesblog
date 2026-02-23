import { json, error, handleCors, requireAuth, genId, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

// GET /api/admin/posts - 后台文章列表（包含草稿，支持分页和分类筛选）
export async function onRequestGet({ request }) {
  try {
    await requireAuth(request)
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const category = url.searchParams.get('category') || ''

    const kv = getKV()
    const indexStr = await kv.get('posts:index')
    let posts = indexStr ? JSON.parse(indexStr) : []

    if (category) posts = posts.filter(p => p.category === category)

    // 按 sortOrder 排序，无 sortOrder 的排在后面，再按创建时间倒序
    posts.sort((a, b) => {
      const sa = typeof a.sortOrder === 'number' ? a.sortOrder : Infinity
      const sb = typeof b.sortOrder === 'number' ? b.sortOrder : Infinity
      if (sa !== sb) return sa - sb
      return (b.createdAt || 0) - (a.createdAt || 0)
    })

    const total = posts.length
    const start = (page - 1) * limit
    return json({ posts: posts.slice(start, start + limit), total, page, limit })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

export async function onRequestPost({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const body = await request.json()

    const id = genId()
    const post = {
      id, title: body.title || '', summary: body.summary || '',
      content: body.content || '', category: body.category || '',
      tags: body.tags || [], cover: body.cover || '',
      published: body.published || false,
      showOnHome: body.showOnHome || false,
      commentsEnabled: body.commentsEnabled !== false,
      createdAt: Date.now(), updatedAt: Date.now()
    }

    await kv.put(`post:${id}`, JSON.stringify(post))

    const indexStr = await kv.get('posts:index')
    const index = indexStr ? JSON.parse(indexStr) : []
    const { content, ...meta } = post
    index.unshift(meta)
    await kv.put('posts:index', JSON.stringify(index))

    return json({ post: meta })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

// PUT /api/admin/posts - 批量更新文章排序
export async function onRequestPut({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const body = await request.json()
    const orders = body.orders // [{ id, sortOrder }]
    if (!Array.isArray(orders)) return error('参数错误', 400)

    const indexStr = await kv.get('posts:index')
    const index = indexStr ? JSON.parse(indexStr) : []
    const orderMap = Object.fromEntries(orders.map(o => [o.id, o.sortOrder]))

    for (const post of index) {
      if (orderMap[post.id] !== undefined) {
        if (orderMap[post.id] === null) {
          delete post.sortOrder
        } else {
          post.sortOrder = orderMap[post.id]
        }
      }
    }
    await kv.put('posts:index', JSON.stringify(index))

    return json({ success: true })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestGet, onRequestPost, onRequestPut, onRequestOptions })