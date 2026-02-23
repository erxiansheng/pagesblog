import { json, error, handleCors, requireAuth, getKV } from '../../_helpers.js'
import { createESAHandler } from '../../_helpers.js'

export async function onRequestDelete({ request, params }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const name = decodeURIComponent(params.name)

    const catsStr = await kv.get('categories')
    const categories = catsStr ? JSON.parse(catsStr) : []
    const filtered = categories.filter(c => c !== name)
    await kv.put('categories', JSON.stringify(filtered))
    return json({ categories: filtered })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestDelete, onRequestOptions, _pattern: '/api/admin/categories/[name]' })