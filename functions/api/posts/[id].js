import { json, error, handleCors, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

export async function onRequestGet({ params }) {
  try {
    const kv = getKV()
    const id = params.id

    // 批量读取所有需要的数据（1 次 KV 调用合并为并行，但仍是多次调用）
    // 阿里云 ESA KV 限制 8 次，这里精简为最少调用
    const today = new Date().toISOString().slice(0, 10)
    const viewKey = `views:${id}`
    const dailyKey = `daily_views:${today}`
    const readKey = `daily_reads:${today}`

    // 第 1-4 次：并行读取
    const [postStr, viewsStr, dailyStr, readsStr] = await Promise.all([
      kv.get(`post:${id}`),
      kv.get(viewKey),
      kv.get(dailyKey),
      kv.get(readKey)
    ])
    if (!postStr) return error('Post not found', 404)

    const views = parseInt(viewsStr || '0') + 1
    const daily = parseInt(dailyStr || '0') + 1
    const reads = readsStr ? JSON.parse(readsStr) : []
    const needTrackRead = !reads.includes(id)
    if (needTrackRead) reads.push(id)

    // 第 5-7 次：并行写入 + 读评论
    const writeOps = [
      kv.put(viewKey, String(views)),
      kv.put(dailyKey, String(daily)),
      kv.get(`comments:${id}`)
    ]
    if (needTrackRead) {
      // 第 8 次（仅在需要时）
      writeOps.push(kv.put(readKey, JSON.stringify(reads)))
    }
    const results = await Promise.all(writeOps)
    const commentsStr = results[2]

    const post = JSON.parse(postStr)
    post.views = views

    const comments = commentsStr ? JSON.parse(commentsStr) : []
    post.comments = comments.filter(c => c.approved !== false)

    return json({ post })
  } catch (e) {
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestGet, onRequestOptions, _pattern: '/api/posts/[id]' })