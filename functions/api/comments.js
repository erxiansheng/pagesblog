import { json, error, handleCors, getKV, genId } from './_helpers.js'
import { createESAHandler } from './_helpers.js'

// POST /api/comments - submit a comment
export async function onRequestPost({ request }) {
  try {
    const kv = getKV()
    const body = await request.json()
    const { postId, nickname, content, captchaId, captchaAnswer } = body

    if (!postId || !nickname?.trim() || !content?.trim()) return error('请填写完整信息')
    if (!captchaId || !captchaAnswer) return error('请完成验证码')

    // Check if comments are enabled for this post
    const postStr = await kv.get(`post:${postId}`)
    if (postStr) {
      const postData = JSON.parse(postStr)
      if (postData.commentsEnabled === false) return error('该文章已关闭评论')
    }

    // Verify captcha
    const capStr = await kv.get(`captcha:${captchaId}`)
    if (!capStr) return error('验证码已过期')
    const cap = JSON.parse(capStr)
    await kv.delete(`captcha:${captchaId}`)
    if (cap.exp < Date.now()) return error('验证码已过期')
    if (parseInt(captchaAnswer) !== cap.answer) return error('验证码错误')

    const comment = {
      id: genId(),
      postId,
      nickname: nickname.trim().slice(0, 30),
      content: content.trim().slice(0, 500),
      createdAt: Date.now(),
      approved: true
    }

    // Add to post comments
    const commentsStr = await kv.get(`comments:${postId}`)
    const comments = commentsStr ? JSON.parse(commentsStr) : []
    comments.unshift(comment)
    await kv.put(`comments:${postId}`, JSON.stringify(comments))

    // Update global comments index
    const indexStr = await kv.get('comments:index')
    const index = indexStr ? JSON.parse(indexStr) : []
    index.unshift({ ...comment, content: comment.content.slice(0, 50) })
    await kv.put('comments:index', JSON.stringify(index.slice(0, 500)))

    return json({ comment })
  } catch (e) {
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestPost, onRequestOptions })