import { json, error, handleCors, getKV } from './_helpers.js'
import { createESAHandler } from './_helpers.js'

export async function onRequestGet() {
  try {
    const kv = getKV()
    const settingsStr = await kv.get('site:settings')
    const settings = settingsStr ? JSON.parse(settingsStr) : {
      siteName: 'My Blog', subtitle: '个人博客', description: '记录技术与生活', about: ''
    }
    const { passwordHash, ...publicSettings } = settings
    return json(publicSettings)
  } catch (e) {
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestGet, onRequestOptions })