import { json, error, handleCors, requireAuth, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

// GET - list all images with usage info
export async function onRequestGet({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()

    const indexStr = await kv.get('images:index')
    const images = indexStr ? JSON.parse(indexStr) : []

    // Collect all referenced image URLs from posts index metadata (no per-post KV reads)
    const postsIndexStr = await kv.get('posts:index')
    const postsIndex = postsIndexStr ? JSON.parse(postsIndexStr) : []
    const usedUrls = new Set()

    for (const meta of postsIndex) {
      if (meta.cover) usedUrls.add(meta.cover)
      // imageRefs is populated when posts are saved/updated
      if (Array.isArray(meta.imageRefs)) {
        meta.imageRefs.forEach(u => usedUrls.add(u))
      }
    }

    // Also check settings and navlinks for images (2 KV reads)
    const [settingsStr, navStr] = await Promise.all([
      kv.get('site:settings'),
      kv.get('nav:links')
    ])
    if (settingsStr) {
      const sm = settingsStr.match(/\/uploads\/[^\s)"']+/g)
      if (sm) sm.forEach(u => usedUrls.add(u))
    }
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

    // 读取 meta 和 index 并行
    const [metaStr, indexStr] = await Promise.all([
      kv.get(`image_meta:${filename}`),
      kv.get('images:index')
    ])

    // 并行删除所有相关 keys
    const deleteOps = [
      kv.delete(`image:${filename}`),
      kv.delete(`image_meta:${filename}`)
    ]
    if (metaStr) {
      const meta = JSON.parse(metaStr)
      if (meta.chunked && meta.totalChunks) {
        for (let i = 0; i < meta.totalChunks; i++) {
          deleteOps.push(kv.delete(`image:${filename}:chunk:${i}`))
        }
      }
    }

    // 更新索引
    let index = indexStr ? JSON.parse(indexStr) : []
    index = index.filter(i => i.filename !== filename)
    deleteOps.push(kv.put('images:index', JSON.stringify(index)))

    await Promise.all(deleteOps)

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