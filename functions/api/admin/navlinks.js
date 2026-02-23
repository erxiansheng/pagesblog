import { json, error, handleCors, requireAuth, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

// GET - 获取导航链接
export async function onRequestGet({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const linksStr = await kv.get('nav:links')
    return json({ links: linksStr ? JSON.parse(linksStr) : [] })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

// PUT - 保存全部导航链接
export async function onRequestPut({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const { links } = await request.json()
    await kv.put('nav:links', JSON.stringify(links || []))
    return json({ links })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestGet, onRequestPut, onRequestOptions })