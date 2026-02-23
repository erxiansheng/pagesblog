import { json, error, handleCors, getKV } from './_helpers.js'
import { createESAHandler } from './_helpers.js'

export async function onRequestGet() {
  try {
    const kv = getKV()
    const catsStr = await kv.get('categories')
    return json({ categories: catsStr ? JSON.parse(catsStr) : [] })
  } catch (e) {
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestGet, onRequestOptions })