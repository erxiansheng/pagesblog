import { json, error, handleCors, createToken, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

export async function onRequestPost({ request }) {
  try {
    const kv = getKV()
    const { password } = await request.json()
    if (!password) return error('请输入密码')

    const settingsStr = await kv.get('site:settings')
    const settings = settingsStr ? JSON.parse(settingsStr) : {}

    const inputHash = await hashPassword(password)
    const storedHash = settings.passwordHash || await hashPassword('admin123')

    if (inputHash !== storedHash) return error('密码错误', 401)

    const token = await createToken({ role: 'admin' })
    return json({ token })
  } catch (e) {
    return error(e.message, 500)
  }
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestPost, onRequestOptions })