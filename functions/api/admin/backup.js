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

// GET: 导出备份数据（支持分批：?keys=key1,key2,... 或不传则返回所有 key 列表）
export async function onRequestGet({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const url = new URL(request.url)
    const keysParam = url.searchParams.get('keys')

    // 分批模式：只读取指定的 keys
    if (keysParam) {
      const keys = keysParam.split(',').filter(Boolean)
      const data = {}
      for (const key of keys) {
        const val = await kv.get(key)
        if (val) data[key] = val
      }
      return json({ data })
    }

    // 默认模式：返回所有需要备份的 key 列表（不含数据）
    const allKeys = [...BACKUP_KEYS]

    // 收集文章 keys
    const indexStr = await kv.get('posts:index')
    if (indexStr) {
      const posts = JSON.parse(indexStr)
      for (const p of posts) {
        allKeys.push(`post:${p.id}`)
      }
    }

    // 收集图片 keys
    const imagesIndexStr = await kv.get('images:index')
    if (imagesIndexStr) {
      const images = JSON.parse(imagesIndexStr)
      for (const img of images) {
        const fn = img.filename
        allKeys.push(`image:${fn}`)
        allKeys.push(`image_meta:${fn}`)
        // 检查是否分块
        const metaStr = await kv.get(`image_meta:${fn}`)
        if (metaStr) {
          try {
            const meta = JSON.parse(metaStr)
            if (meta.chunked && meta.totalChunks) {
              for (let i = 0; i < meta.totalChunks; i++) {
                allKeys.push(`image:${fn}:chunk:${i}`)
              }
            }
          } catch (e) { /* ignore */ }
        }
      }
    }

    return json({ keys: allKeys })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

// POST: 恢复备份数据（分批写入，每次最多 5 个 key）
export async function onRequestPost({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const body = await request.json()

    if (!body || !body.data) {
      return error('无效的备份数据', 400)
    }

    const keys = Object.keys(body.data)
    for (const key of keys) {
      await kv.put(key, body.data[key])
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
