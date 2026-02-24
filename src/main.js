import { createApp } from 'vue'
import App from './App.vue'
import router, { setSiteTitle } from './router'
import './styles/global.css'
import { useTheme } from './composables/useTheme'
import { getSiteSettings } from './api'

const { initTheme } = useTheme()
initTheme()

createApp(App).use(router).mount('#app')

// Apply custom favicon and SEO settings
getSiteSettings().then(data => {
  if (!data) return
  // Favicon
  if (data.faviconSvg) {
    const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data.faviconSvg)))
    let link = document.querySelector("link[rel*='icon']")
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link) }
    link.type = 'image/svg+xml'
    link.href = url
  }
  // Page title
  if (data.pageTitle || data.siteName) {
    const title = data.pageTitle || data.siteName
    document.title = title
    setSiteTitle(title)
  }
  // SEO meta tags
  if (data.seoEnabled) {
    if (data.seoDescription) {
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta) }
      meta.content = data.seoDescription
    }
    if (data.seoKeywords) {
      let meta = document.querySelector('meta[name="keywords"]')
      if (!meta) { meta = document.createElement('meta'); meta.name = 'keywords'; document.head.appendChild(meta) }
      meta.content = data.seoKeywords
    }
    if (data.seoRobots) {
      let meta = document.querySelector('meta[name="robots"]')
      if (!meta) { meta = document.createElement('meta'); meta.name = 'robots'; document.head.appendChild(meta) }
      meta.content = data.seoRobots
    }
  }
}).catch(() => {})
