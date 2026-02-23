import { json, error, handleCors, requireAuth, genId, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

// GET /api/admin/posts - 后台文章列表（包含草稿）
export async function onRequestGet({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const indexStr = await kv.get('posts:index')
    let posts = indexStr ? JSON.parse(indexStr) : []
    posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    return json({ posts, total: posts.length })
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

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestGet, onRequestPost, onRequestOptions })