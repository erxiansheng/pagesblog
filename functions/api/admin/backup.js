import { json, error, handleCors, requireAuth, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

// 需要备份的 KV 键列表
const BACKUP_KEYS = [
  'site:settings',
  'posts:index',
  'categories',
  'images:index',
  'navlinks',
  'comments:index'
]

// GET: 导出备份数据
export async function onRequestGet({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const backup = { version: 2, createdAt: new Date().toISOString(), data: {} }

    // 备份基础键
    for (const key of BACKUP_KEYS) {
      const val = await kv.get(key)
      if (val) backup.data[key] = val
    }

    // 备份每篇文章的完整内容
    const indexStr = await kv.get('posts:index')
    if (indexStr) {
      const posts = JSON.parse(indexStr)
      for (const p of posts) {
        const postData = await kv.get(`post:${p.id}`)
        if (postData) backup.data[`post:${p.id}`] = postData
      }
    }

    // 备份所有图片/模型文件（base64 数据 + metadata + 分块）
    const imagesIndexStr = await kv.get('images:index')
    if (imagesIndexStr) {
      const images = JSON.parse(imagesIndexStr)
      for (const img of images) {
        const fn = img.filename
        // 读取 metadata
        const metaStr = await kv.get(`image_meta:${fn}`)
        if (metaStr) {
          backup.data[`image_meta:${fn}`] = metaStr
          const meta = JSON.parse(metaStr)
          if (meta.chunked && meta.totalChunks) {
            // 分块存储：备份主 key + 所有 chunks
            const mainVal = await kv.get(`image:${fn}`)
            if (mainVal) backup.data[`image:${fn}`] = mainVal
            for (let i = 0; i < meta.totalChunks; i++) {
              const chunk = await kv.get(`image:${fn}:chunk:${i}`)
              if (chunk) backup.data[`image:${fn}:chunk:${i}`] = chunk
            }
          } else {
            // 非分块：直接备份 base64
            const val = await kv.get(`image:${fn}`)
            if (val) backup.data[`image:${fn}`] = val
          }
        } else {
          // 没有 meta 也尝试备份主数据
          const val = await kv.get(`image:${fn}`)
          if (val) backup.data[`image:${fn}`] = val
        }
      }
    }

    return json(backup)
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

// POST: 恢复备份数据
export async function onRequestPost({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const backup = await request.json()

    if (!backup || !backup.data) {
      return error('无效的备份文件', 400)
    }

    // 写入所有备份的键值对
    const keys = Object.keys(backup.data)
    for (const key of keys) {
      await kv.put(key, backup.data[key])
    }

    return json({ success: true, restoredKeys: keys.length })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestGet, onRequestPost, onRequestOptions })
