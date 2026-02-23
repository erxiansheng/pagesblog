import { json, error, handleCors, requireAuth, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

// GET - list all images with usage info
export async function onRequestGet({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()

    const indexStr = await kv.get('images:index')
    const images = indexStr ? JSON.parse(indexStr) : []

    // Collect all referenced image URLs from posts
    const postsIndexStr = await kv.get('posts:index')
    const postsIndex = postsIndexStr ? JSON.parse(postsIndexStr) : []
    const usedUrls = new Set()

    for (const meta of postsIndex) {
      if (meta.cover) usedUrls.add(meta.cover)
      // Check full post content for image references
      const postStr = await kv.get(`post:${meta.id}`)
      if (postStr) {
        const post = JSON.parse(postStr)
        const matches = (post.content || '').match(/\/uploads\/[^\s)"']+/g)
        if (matches) matches.forEach(u => usedUrls.add(u))
      }
    }

    // Also check settings and navlinks for images
    const settingsStr = await kv.get('site:settings')
    if (settingsStr) {
      const sm = settingsStr.match(/\/uploads\/[^\s)"']+/g)
      if (sm) sm.forEach(u => usedUrls.add(u))
    }
    const navStr = await kv.get('nav:links')
    if (navStr) {
      const navLinks = JSON.parse(navStr)
      if (Array.isArray(navLinks)) {
        navLinks.forEach(link => {
          if (link.image) usedUrls.add(link.image)
        })
      }
    }

    const result = images.map(img => ({
      ...img,
      url: `/uploads/${img.filename}`,
      used: usedUrls.has(`/uploads/${img.filename}`)
    }))

    return json({ images: result })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

// POST - delete an image
export async function onRequestPost({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const { filename } = await request.json()
    if (!filename) return error('缺少文件名')

    // 检查是否分块存储，清理所有 chunks
    const metaStr = await kv.get(`image_meta:${filename}`)
    if (metaStr) {
      const meta = JSON.parse(metaStr)
      if (meta.chunked && meta.totalChunks) {
        for (let i = 0; i < meta.totalChunks; i++) {
          await kv.delete(`image:${filename}:chunk:${i}`)
        }
      }
    }

    await kv.delete(`image:${filename}`)
    await kv.delete(`image_meta:${filename}`)

    const indexStr = await kv.get('images:index')
    let index = indexStr ? JSON.parse(indexStr) : []
    index = index.filter(i => i.filename !== filename)
    await kv.put('images:index', JSON.stringify(index))

    return json({ success: true })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestGet, onRequestPost, onRequestOptions })