import { json, error, handleCors, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

export async function onRequestGet({ params }) {
  try {
    const kv = getKV()
    const id = params.id
    const postStr = await kv.get(`post:${id}`)
    if (!postStr) return error('Post not found', 404)

    // Increment view count
    const viewKey = `views:${id}`
    const views = parseInt(await kv.get(viewKey) || '0') + 1
    await kv.put(viewKey, String(views))

    // Track daily views
    const today = new Date().toISOString().slice(0, 10)
    const dailyKey = `daily_views:${today}`
    const daily = parseInt(await kv.get(dailyKey) || '0') + 1
    await kv.put(dailyKey, String(daily))

    // Track daily unique reads (by post)
    const readKey = `daily_reads:${today}`
    const readsStr = await kv.get(readKey)
    const reads = readsStr ? JSON.parse(readsStr) : []
    if (!reads.includes(id)) {
      reads.push(id)
      await kv.put(readKey, JSON.stringify(reads))
    }

    const post = JSON.parse(postStr)
    post.views = views

    // Get comments
    const commentsStr = await kv.get(`comments:${id}`)
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