import { json, error, handleCors, requireAuth, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

export async function onRequestPost({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file) return error('没有文件')

    const ext = file.name.split('.').pop().toLowerCase()
    const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'glb', 'gltf']
    if (!allowed.includes(ext)) return error('不支持的文件格式')
    if (file.size > 10 * 1024 * 1024) return error('文件不能超过10MB')

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    // 文件转 base64 存入 KV
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // 高效 base64 编码：分批处理避免超大字符串拼接导致边缘函数超时
    const BATCH = 32768
    const parts = []
    for (let i = 0; i < bytes.byteLength; i += BATCH) {
      const slice = bytes.subarray(i, Math.min(i + BATCH, bytes.byteLength))
      parts.push(String.fromCharCode.apply(null, slice))
    }
    const base64 = btoa(parts.join(''))

    // 大文件分块存储（KV 单个 key 限制约 1.5MB，base64 后更大）
    const CHUNK_SIZE = 512 * 1024 // 512KB per chunk (safer for KV limits)
    if (base64.length > CHUNK_SIZE) {
      const totalChunks = Math.ceil(base64.length / CHUNK_SIZE)
      // 并行写入所有 chunks（减少串行 KV 调用次数）
      const chunkOps = []
      for (let i = 0; i < totalChunks; i++) {
        const chunk = base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
        chunkOps.push(kv.put(`image:${filename}:chunk:${i}`, chunk))
      }
      // 同时写入 meta 和主 key
      chunkOps.push(kv.put(`image_meta:${filename}`, JSON.stringify({
        contentType: file.type, size: file.size, originalName: file.name,
        chunked: true, totalChunks
      })))
      chunkOps.push(kv.put(`image:${filename}`, JSON.stringify({ chunked: true, totalChunks })))
      await Promise.all(chunkOps)
    } else {
      await Promise.all([
        kv.put(`image:${filename}`, base64),
        kv.put(`image_meta:${filename}`, JSON.stringify({
          contentType: file.type, size: file.size, originalName: file.name
        }))
      ])
    }

    // 更新图片索引
    const indexStr = await kv.get('images:index')
    const index = indexStr ? JSON.parse(indexStr) : []
    index.unshift({ filename, contentType: file.type, size: file.size, originalName: file.name, createdAt: Date.now() })
    await kv.put('images:index', JSON.stringify(index))

    return json({ url: `/uploads/${filename}`, filename })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestPost, onRequestOptions })