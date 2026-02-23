import { json, error, handleCors, getKV } from './_helpers.js'
import { createESAHandler } from './_helpers.js'

export async function onRequestGet() {
  try {
    const kv = getKV()
    const linksStr = await kv.get('nav:links')
    return json({ links: linksStr ? JSON.parse(linksStr) : [] })
  } catch (e) {
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestGet, onRequestOptions })