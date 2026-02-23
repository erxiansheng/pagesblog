import { json, error, handleCors, getKV, genId } from './_helpers.js'
import { createESAHandler } from './_helpers.js'

// 评论内容风控规则
const BLOCKED_PATTERNS = [
  // 广告类
  /加\s*[微v]\s*信/i, /加\s*QQ/i, /扫\s*码/i, /免\s*费\s*领/i,
  /日\s*赚/i, /月\s*入/i, /兼\s*职/i, /代\s*理/i, /优\s*惠\s*券/i,
  /点\s*击\s*链\s*接/i, /复\s*制\s*打\s*开/i, /淘\s*宝\s*搜/i,
  /推\s*广/i, /引\s*流/i, /私\s*聊/i,
  // URL / 联系方式
  /https?:\/\/[^\s]+/i, /www\.[^\s]+/i,
  /\d{5,}@qq\.com/i, /[\w.-]+@[\w.-]+\.\w{2,}/i,
  /1[3-9]\d{9}/, // 手机号
  // 辱骂 / 不文明用语
  /傻\s*[逼b]/i, /[操草艹]\s*[你尼泥]/i, /妈\s*[的逼b]/i,
  /[滚gun]\s*蛋/i, /废\s*物/i, /垃\s*圾/i, /白\s*痴/i,
  /脑\s*残/i, /智\s*障/i, /去\s*死/i, /贱\s*[人货]/i,
  /狗\s*[日逼b]/i, /混\s*蛋/i, /王\s*八/i,
  /fuck/i, /shit/i, /bitch/i, /asshole/i, /damn\s*you/i,
  // 政治敏感（简要）
  /翻\s*墙/i, /VPN/i,
]

function moderateContent(text) {
  if (!text) return null
  const cleaned = text.replace(/\s+/g, '')
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text) || pattern.test(cleaned)) {
      return '评论包含违规内容，请修改后重试'
    }
  }
  // 重复字符检测（如 啊啊啊啊啊啊啊啊）
  if (/(.)\1{9,}/.test(cleaned)) {
    return '评论包含过多重复字符'
  }
  // 纯符号 / 无意义内容
  if (cleaned.length > 0 && /^[^\u4e00-\u9fa5a-zA-Z0-9]+$/.test(cleaned)) {
    return '请输入有意义的评论内容'
  }
  return null
}

// POST /api/comments - submit a comment
export async function onRequestPost({ request }) {
  try {
    const kv = getKV()
    const body = await request.json()
    const { postId, nickname, content, captchaId, captchaAnswer } = body

    if (!postId || !nickname?.trim() || !content?.trim()) return error('请填写完整信息')
    if (!captchaId || !captchaAnswer) return error('请完成验证码')

    // 风控检测：昵称
    const nickBlock = moderateContent(nickname)
    if (nickBlock) return error(nickBlock)
    // 风控检测：评论内容
    const contentBlock = moderateContent(content)
    if (contentBlock) return error(contentBlock)

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