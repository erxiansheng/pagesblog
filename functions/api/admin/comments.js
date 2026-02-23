import { json, error, handleCors, requireAuth, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

// GET - list all comments
export async function onRequestGet({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const indexStr = await kv.get('comments:index')
    const comments = indexStr ? JSON.parse(indexStr) : []
    return json({ comments })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

// DELETE - delete a comment
export async function onRequestPost({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const { commentId, postId } = await request.json()
    if (!commentId || !postId) return error('缺少参数')

    // Remove from post comments
    const commentsStr = await kv.get(`comments:${postId}`)
    let comments = commentsStr ? JSON.parse(commentsStr) : []
    comments = comments.filter(c => c.id !== commentId)
    await kv.put(`comments:${postId}`, JSON.stringify(comments))

    // Remove from index
    const indexStr = await kv.get('comments:index')
    let index = indexStr ? JSON.parse(indexStr) : []
    index = index.filter(c => c.id !== commentId)
    await kv.put('comments:index', JSON.stringify(index))

    return json({ success: true })
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestGet, onRequestPost, onRequestOptions })