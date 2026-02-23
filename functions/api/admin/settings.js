import { json, error, handleCors, requireAuth, getKV } from '../_helpers.js'
import { createESAHandler } from '../_helpers.js'

export async function onRequestPut({ request }) {
  try {
    await requireAuth(request)
    const kv = getKV()
    const body = await request.json()

    const existingStr = await kv.get('site:settings')
    const existing = existingStr ? JSON.parse(existingStr) : {}

    const updated = {
      ...existing,
      siteName: body.siteName ?? existing.siteName ?? 'My Blog',
      subtitle: body.subtitle ?? existing.subtitle ?? '',
      description: body.description ?? existing.description ?? '',
      about: body.about ?? existing.about ?? '',
      socialLinks: body.socialLinks ?? existing.socialLinks ?? [],
      faviconSvg: body.faviconSvg ?? existing.faviconSvg ?? '',
      navDockTitle: body.navDockTitle ?? existing.navDockTitle ?? '',
      pageTitle: body.pageTitle ?? existing.pageTitle ?? '',
      seoEnabled: body.seoEnabled ?? existing.seoEnabled ?? false,
      seoDescription: body.seoDescription ?? existing.seoDescription ?? '',
      seoKeywords: body.seoKeywords ?? existing.seoKeywords ?? '',
      seoRobots: body.seoRobots ?? existing.seoRobots ?? 'index, follow',
      icp: body.icp ?? existing.icp ?? '',
      copyright: body.copyright ?? existing.copyright ?? '',
      models: body.models ?? existing.models ?? [],
      // 保留旧字段兼容
      modelUrl: body.modelUrl ?? existing.modelUrl ?? '',
      modelAnimated: body.modelAnimated ?? existing.modelAnimated ?? false,
      modelScale: body.modelScale ?? existing.modelScale ?? 1,
      modelPosX: body.modelPosX ?? existing.modelPosX ?? 0,
      modelPosY: body.modelPosY ?? existing.modelPosY ?? 0,
      modelZoom: body.modelZoom ?? existing.modelZoom ?? 0
    }

    if (body.password) {
      const data = new TextEncoder().encode(body.password)
      const hash = await crypto.subtle.digest('SHA-256', data)
      updated.passwordHash = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
    }

    await kv.put('site:settings', JSON.stringify(updated))
    const { passwordHash, ...publicSettings } = updated
    return json(publicSettings)
  } catch (e) {
    if (e.message === 'Unauthorized') return error('未授权', 401)
    return error(e.message, 500)
  }
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestPut, onRequestOptions })