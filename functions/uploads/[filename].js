import { getKV, createESAHandler } from '../api/_helpers.js'

export async function onRequestGet({ params }) {
  const filename = params.filename
  try {
    const kv = getKV()

    // 读取文件数据
    const raw = await kv.get(`image:${filename}`)
    if (!raw) return new Response('Not found', { status: 404 })

    // 读取 metadata
    const metaStr = await kv.get(`image_meta:${filename}`)
    const meta = metaStr ? JSON.parse(metaStr) : {}

    // 判断是否分块存储
    let base64
    if (meta.chunked && meta.totalChunks) {
      const chunks = []
      for (let i = 0; i < meta.totalChunks; i++) {
        const chunk = await kv.get(`image:${filename}:chunk:${i}`)
        if (!chunk) return new Response('Chunk missing', { status: 500 })
        chunks.push(chunk)
      }
      base64 = chunks.join('')
    } else {
      base64 = raw
    }

    // base64 解码为二进制（分批处理避免超时）
    const binaryStr = atob(base64)
    const len = binaryStr.length
    const bytes = new Uint8Array(len)
    const BATCH = 32768
    for (let i = 0; i < len; i += BATCH) {
      const end = Math.min(i + BATCH, len)
      for (let j = i; j < end; j++) {
        bytes[j] = binaryStr.charCodeAt(j)
      }
    }

    return new Response(bytes.buffer, {
      status: 200,
      headers: {
        'Content-Type': meta.contentType || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 })
  }
}

export default createESAHandler({ onRequestGet, _pattern: '/uploads/[filename]' })