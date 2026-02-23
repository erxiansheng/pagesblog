import { json, error, handleCors, getKV } from './_helpers.js'
import { createESAHandler } from './_helpers.js'

export async function onRequestGet({ request }) {
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '10')
  const category = url.searchParams.get('category') || ''
  const search = (url.searchParams.get('search') || '').trim().toLowerCase()

  try {
    const kv = getKV()
    const indexStr = await kv.get('posts:index')
    let posts = indexStr ? JSON.parse(indexStr) : []

    posts = posts.filter(p => p.published)
    if (category) posts = posts.filter(p => p.category === category)
    if (search) {
      posts = posts.filter(p =>
        (p.title && p.title.toLowerCase().includes(search)) ||
        (p.summary && p.summary.toLowerCase().includes(search)) ||
        (p.category && p.category.toLowerCase().includes(search))
      )
    }
    // 按 sortOrder 排序（如果有），否则按创建时间倒序
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
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestGet, onRequestOptions })