import { json, error, handleCors, requireAuth, getKV } from '../../_helpers.js'
import { createESAHandler } from '../../_helpers.js'

export async function onRequestPut({ request, params }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const body = await request.json()
    const id = params.id

    const existingStr = await kv.get(`post:${id}`)
    if (!existingStr) return error('文章不存在', 404)

    const existing = JSON.parse(existingStr)
    const updated = {
      ...existing,
      title: body.title ?? existing.title, summary: body.summary ?? existing.summary,
      content: body.content ?? existing.content, category: body.category ?? existing.category,
      tags: body.tags ?? existing.tags, cover: body.cover ?? existing.cover,
      published: body.published ?? existing.published,
      showOnHome: body.showOnHome ?? existing.showOnHome ?? false,
      commentsEnabled: body.commentsEnabled ?? existing.commentsEnabled ?? true,
      updatedAt: Date.now()
    }

    await kv.put(`post:${id}`, JSON.stringify(updated))

    const indexStr = await kv.get('posts:index')
    const index = indexStr ? JSON.parse(indexStr) : []
    const { content, ...meta } = updated
    const idx = index.findIndex(p => p.id === id)
    if (idx >= 0) index[idx] = meta; else index.unshift(meta)
    await kv.put('posts:index', JSON.stringify(index))

    return json({ post: meta })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

export async function onRequestDelete({ request, params }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const id = params.id

    await kv.delete(`post:${id}`)

    const indexStr = await kv.get('posts:index')
    const index = indexStr ? JSON.parse(indexStr) : []
    await kv.put('posts:index', JSON.stringify(index.filter(p => p.id !== id)))

    return json({ success: true })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestPut, onRequestDelete, onRequestOptions, _pattern: '/api/admin/posts/[id]' })