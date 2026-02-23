// Shared helpers for Pages Functions
// 兼容 EdgeOne Pages KV 和 阿里云 ESA EdgeKV
// EdgeOne: 通过全局绑定变量 blog_data 访问
// 阿里云 ESA: 通过 new EdgeKV({ namespace }) 访问

const ALIYUN_KV_NAMESPACE = 'blog_data'

function createAliyunKVWrapper(ns) {
  const kv = new EdgeKV({ namespace: ns })
  return {
    async get(key) {
      try {
        const val = await kv.get(key, { type: 'text' })
        return val === undefined || val === null ? null : val
      } catch (e) {
        // 阿里云 EdgeKV 在 key 不存在时会抛异常，视为 null
        return null
      }
    },
    async put(key, value) {
      return kv.put(key, value)
    },
    async delete(key) {
      try {
        return await kv.delete(key)
      } catch (e) {
        // key 不存在时删除可能也会抛异常，忽略
        return null
      }
    }
  }
}

function getKV() {
  // 阿里云 ESA: EdgeKV 是全局构造函数
  if (typeof EdgeKV !== 'undefined') {
    return createAliyunKVWrapper(ALIYUN_KV_NAMESPACE)
  }
  // EdgeOne Pages: 通过全局绑定变量访问
  if (typeof blog_data !== 'undefined') {
    return blog_data
  }
  throw new Error('No KV runtime detected. Please configure KV binding.')
}

export { getKV }

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}

export function error(msg, status = 400) {
  return json({ error: msg }, status)
}

export function handleCors() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}

// Simple JWT-like token (HMAC-based for edge runtime)
const SECRET = 'blog-admin-secret-change-me'

export async function createToken(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 3600 * 1000 }))
  const data = `${header}.${body}`
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return `${data}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`
}

export async function verifyToken(token) {
  if (!token) return null
  try {
    const [header, body, sig] = token.split('.')
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    )
    const data = `${header}.${body}`
    const sigBytes = Uint8Array.from(atob(sig), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data))
    if (!valid) return null
    const payload = JSON.parse(atob(body))
    if (payload.exp < Date.now()) return null
    return payload
  } catch { return null }
}

export async function requireAuth(request) {
  const auth = request.headers.get('Authorization')
  const token = auth?.replace('Bearer ', '')
  const payload = await verifyToken(token)
  if (!payload) throw new Error('Unauthorized')
  return payload
}

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// 阿里云 ESA 兼容适配器
// EdgeOne Pages 使用 onRequestGet/Post/Put/Delete 命名导出 + 文件路由
// 阿里云 ESA Pages 使用 export default { fetch(request) } 单入口
// 此函数为每个 handler 模块生成兼容的 default export
export function createESAHandler(handlers) {
  return {
    async fetch(request, env) {
      const method = request.method.toUpperCase()
      if (method === 'OPTIONS' && handlers.onRequestOptions) {
        return handlers.onRequestOptions({ request, env })
      }

      // 从 URL 路径中提取动态参数 (如 [id], [name], [filename])
      const url = new URL(request.url)
      const params = extractParams(url.pathname, handlers._pattern || '')

      const ctx = { request, env, params }

      const methodMap = {
        GET: 'onRequestGet',
        POST: 'onRequestPost',
        PUT: 'onRequestPut',
        DELETE: 'onRequestDelete',
        PATCH: 'onRequestPatch'
      }

      const handlerName = methodMap[method]
      if (handlerName && handlers[handlerName]) {
        return handlers[handlerName](ctx)
      }

      return new Response('Method Not Allowed', { status: 405 })
    }
  }
}

function extractParams(pathname, pattern) {
  if (!pattern) return {}
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = pathname.split('/').filter(Boolean)
  const params = {}
  for (let i = 0; i < patternParts.length; i++) {
    const m = patternParts[i].match(/^\[(.+)\]$/)
    if (m && pathParts[i]) {
      params[m[1]] = decodeURIComponent(pathParts[i])
    }
  }
  return params
}
