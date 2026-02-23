import { json, error, handleCors, requireAuth, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

// 需要备份的 KV 键列表
const BACKUP_KEYS = [
  'site:settings',
  'posts:index',
  'categories',
  'images:index',
  'navlinks',
  'nav:links',
  'comments:index'
]

// GET: 导出备份数据（支持分批：?keys=key1,key2,... 或不传则返回所有 key 列表）
export async function onRequestGet({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const url = new URL(request.url)
    const keysParam = url.searchParams.get('keys')

    // 分批模式：只读取指定的 keys（客户端应控制每批不超过 6 个）
    if (keysParam) {
      const keys = keysParam.split(',').filter(Boolean).slice(0, 6)
      const data = {}
      const extraKeys = [] // 发现的分块 keys
      for (const key of keys) {
        const val = await kv.get(key)
        if (val) {
          data[key] = val
          // 如果是 image_meta，检查是否有分块，返回额外的 chunk keys
          if (key.startsWith('image_meta:') ) {
            try {
              const meta = JSON.parse(val)
              if (meta.chunked && meta.totalChunks) {
                const fn = key.replace('image_meta:', '')
                for (let i = 0; i < meta.totalChunks; i++) {
                  extraKeys.push(`image:${fn}:chunk:${i}`)
                }
              }
            } catch (e) { /* ignore */ }
          }
        }
      }
      return json({ data, extraKeys })
    }

    // 默认模式：返回所有需要备份的 key 列表（不含数据）
    const allKeys = [...BACKUP_KEYS]

    // 并行收集文章和图片 keys（2 次 KV 调用）
    const [indexStr, imagesIndexStr] = await Promise.all([
      kv.get('posts:index'),
      kv.get('images:index')
    ])

    if (indexStr) {
      const posts = JSON.parse(indexStr)
      for (const p of posts) {
        allKeys.push(`post:${p.id}`)
      }
    }

    // 图片 keys：将 image 和 image_meta 都加入列表
    // 分块信息通过分批读取 meta 获取，但为避免超限，
    // 将 meta 读取放到分批 GET 请求中由客户端处理
    if (imagesIndexStr) {
      const images = JSON.parse(imagesIndexStr)
      for (const img of images) {
        const fn = img.filename
        allKeys.push(`image:${fn}`)
        allKeys.push(`image_meta:${fn}`)
      }
    }

    return json({ keys: allKeys, needsChunkScan: true })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

// POST: 恢复备份数据（分批写入，客户端应控制每批不超过 3 个 key）
export async function onRequestPost({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const body = await request.json()

    if (!body || !body.data) {
      return error('无效的备份数据', 400)
    }

    const keys = Object.keys(body.data).slice(0, 3) // 限制每批最多 3 个
    const errors = []
    for (const key of keys) {
      try {
        const value = body.data[key]
        await kv.put(key, typeof value === 'string' ? value : JSON.stringify(value))
      } catch (e) {
        errors.push({ key, error: e.message || String(e) })
      }
    }

    if (errors.length) {
      return json({ success: false, restoredKeys: keys.length - errors.length, errors }, 207)
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
