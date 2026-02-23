import { json, error, handleCors, requireAuth, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

export async function onRequestGet({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const today = new Date().toISOString().slice(0, 10)

    // 并行读取所有数据（6 次 KV 调用）
    const [indexStr, catsStr, imagesStr, dailyViewsStr, readsStr, commentsIndexStr] = await Promise.all([
      kv.get('posts:index'),
      kv.get('categories'),
      kv.get('images:index'),
      kv.get(`daily_views:${today}`),
      kv.get(`daily_reads:${today}`),
      kv.get('comments:index')
    ])

    const posts = indexStr ? JSON.parse(indexStr) : []
    const categories = catsStr ? JSON.parse(catsStr) : []
    const images = imagesStr ? JSON.parse(imagesStr) : []
    const todayViews = parseInt(dailyViewsStr || '0')
    const todayReads = readsStr ? JSON.parse(readsStr).length : 0
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