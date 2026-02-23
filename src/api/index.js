const BASE = '/api'

function headers() {
  const h = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('blog_token')
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

async function request(url, options = {}) {
  const res = await fetch(BASE + url, { headers: headers(), ...options })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// Public API
export const getPosts = (page = 1, limit = 10) => request(`/posts?page=${page}&limit=${limit}`)
export const getPost = (id) => request(`/posts/${id}`)
export const getCategories = () => request(`/categories`)
export const getPostsByCategory = (name, page = 1) => request(`/posts?category=${name}&page=${page}`)
export const getSiteSettings = () => request(`/settings`)
export const getNavLinks = () => request(`/navlinks`)

// Admin API
export const login = (password) => request('/admin/login', {
  method: 'POST', body: JSON.stringify({ password })
})
export const getAdminPosts = () => request('/admin/posts')
export const createPost = (data) => request('/admin/posts', {
  method: 'POST', body: JSON.stringify(data)
})
export const updatePost = (id, data) => request(`/admin/posts/${id}`, {
  method: 'PUT', body: JSON.stringify(data)
})
export const deletePost = (id) => request(`/admin/posts/${id}`, { method: 'DELETE' })
export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const h = {}
  const token = localStorage.getItem('blog_token')
  if (token) h['Authorization'] = `Bearer ${token}`
  return fetch(BASE + '/admin/upload', { method: 'POST', headers: h, body: formData })
    .then(r => r.json())
}
export const saveCategory = (data) => request('/admin/categories', {
  method: 'POST', body: JSON.stringify(data)
})
export const deleteCategory = (name) => request(`/admin/categories/${encodeURIComponent(name)}`, {
  method: 'DELETE'
})
export const saveSettings = (data) => request('/admin/settings', {
  method: 'PUT', body: JSON.stringify(data)
})
export const getStats = () => request('/admin/stats')
export const getAdminNavLinks = () => request('/admin/navlinks')
export const saveNavLinks = (links) => request('/admin/navlinks', {
  method: 'PUT', body: JSON.stringify({ links })
})

// Captcha & Comments
export const getCaptcha = () => request('/captcha')
export const submitComment = (data) => request('/comments', {
  method: 'POST', body: JSON.stringify(data)
})
export const getAdminComments = () => request('/admin/comments')
export const deleteComment = (commentId, postId) => request('/admin/comments', {
  method: 'POST', body: JSON.stringify({ commentId, postId })
})

// Admin Images
export const getAdminImages = () => request('/admin/images')
export const deleteImage = (filename) => request('/admin/images', {
  method: 'POST', body: JSON.stringify({ filename })
})

// Backup & Restore
export const exportBackup = () => request('/admin/backup')
export const importBackup = (data) => request('/admin/backup', {
  method: 'POST', body: JSON.stringify(data)
})
