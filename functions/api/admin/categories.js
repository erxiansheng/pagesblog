import { json, error, handleCors, requireAuth, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

export async function onRequestPost({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const { name } = await request.json()
    if (!name) return error('分类名不能为空')

    const catsStr = await kv.get('categories')
    const categories = catsStr ? JSON.parse(catsStr) : []
    if (categories.includes(name)) return error('分类已存在')

    categories.push(name)
    await kv.put('categories', JSON.stringify(categories))
    return json({ categories })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestPost, onRequestOptions })