import { json, error, handleCors, requireAuth, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

export async function onRequestGet({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()

    const indexStr = await kv.get('posts:index')
    const posts = indexStr ? JSON.parse(indexStr) : []
    const catsStr = await kv.get('categories')
    const categories = catsStr ? JSON.parse(catsStr) : []
    const imagesStr = await kv.get('images:index')
    const images = imagesStr ? JSON.parse(imagesStr) : []

    // Today's views and reads
    const today = new Date().toISOString().slice(0, 10)
    const todayViews = parseInt(await kv.get(`daily_views:${today}`) || '0')
    const readsStr = await kv.get(`daily_reads:${today}`)
    const todayReads = readsStr ? JSON.parse(readsStr).length : 0

    // Comments count
    const commentsIndexStr = await kv.get('comments:index')
    const commentsCount = commentsIndexStr ? JSON.parse(commentsIndexStr).length : 0

    return json({ posts: posts.length, categories: categories.length, images: images.length, todayViews, todayReads, comments: commentsCount })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestGet, onRequestOptions })