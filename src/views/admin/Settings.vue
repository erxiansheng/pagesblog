<template>
  <div class="settings-page">
    <h1>站点设置</h1>
    <Loading v-if="loading" />
    <form v-else @submit.prevent="handleSave" class="settings-form">
      <div class="form-group">
        <label>站点名称</label>
        <input v-model="form.siteName" class="input-field">
      </div>
      <div class="form-group">
        <label>浏览器标题</label>
        <p class="form-hint">显示在浏览器标签页上的标题，留空则使用站点名称</p>
        <input v-model="form.pageTitle" class="input-field" placeholder="我的博客 - 技术分享">
      </div>
      <div class="form-group">
        <label>副标题</label>
        <input v-model="form.subtitle" class="input-field">
      </div>
      <div class="form-group">
        <label>站点描述</label>
        <input v-model="form.description" class="input-field">
      </div>

      <div class="form-section">
        <label>搜索引擎优化 (SEO)</label>
        <div class="toggle-row">
          <label class="toggle-label">
            <input type="checkbox" v-model="form.seoEnabled">
            <span class="toggle-text">启用搜索引擎识别</span>
          </label>
          <p class="form-hint" style="margin:0;">开启后将在页面中注入 meta 标签，帮助搜索引擎收录</p>
        </div>
        <template v-if="form.seoEnabled">
          <div class="form-group" style="margin-top:0.5rem;">
            <label>SEO 描述</label>
            <p class="form-hint">搜索结果中显示的网站描述，建议 50-160 字符</p>
            <textarea v-model="form.seoDescription" rows="3" class="input-textarea" placeholder="输入网站描述..."></textarea>
          </div>
          <div class="form-group">
            <label>SEO 关键词</label>
            <p class="form-hint">多个关键词用英文逗号分隔</p>
            <input v-model="form.seoKeywords" class="input-field" placeholder="博客, 技术, 前端">
          </div>
          <div class="form-group">
            <label>Robots 规则</label>
            <p class="form-hint">控制搜索引擎爬虫行为，默认 index, follow</p>
            <input v-model="form.seoRobots" class="input-field" placeholder="index, follow">
          </div>
        </template>
      </div>

      <div class="form-group">
        <label>版权信息</label>
        <p class="form-hint">页脚显示的版权文字，留空则默认显示「© 年份 站点名称. Powered by EdgeOne Pages」</p>
        <input v-model="form.copyright" class="input-field" placeholder="© 2026 Big Smart. Powered by Big Smart">
      </div>
      <div class="form-group">
        <label>备案号</label>
        <p class="form-hint">ICP 备案号，配置后显示在页脚，留空则不显示</p>
        <input v-model="form.icp" class="input-field" placeholder="京ICP备XXXXXXXX号">
      </div>
      <div class="form-group">
        <label>导航区域标题</label>
        <p class="form-hint">首页右侧导航卡片区域的标题，留空则显示「作品集导航」</p>
        <input v-model="form.navDockTitle" class="input-field" placeholder="作品集导航">
      </div>

      <div class="form-section">
        <label>首页 3D 模型</label>
        <p class="form-hint">上传 GLB/GLTF 格式的 3D 模型（10MB 以内），最多支持 5 个模型，每个模型可独立调节。不上传则使用默认模型。</p>

        <div v-for="(m, idx) in form.models" :key="idx" class="model-item">
          <div class="model-item-header">
            <span class="model-item-title">模型 {{ idx + 1 }}</span>
            <button type="button" @click="removeModelAt(idx)" class="btn-icon btn-danger-icon">✕</button>
          </div>
          <div class="model-row">
            <div class="model-info">
              <span class="model-file">📦 {{ m.url.split('/').pop() }}</span>
            </div>
            <label class="upload-area-sm" :class="{ disabled: modelUploadingIdx === idx }">
              <input type="file" accept=".glb,.gltf" @change="e => handleModelUploadAt(e, idx)" hidden :disabled="modelUploadingIdx === idx">
              <span>{{ modelUploadingIdx === idx ? '上传中...' : '更换模型' }}</span>
            </label>
          </div>
          <div class="model-mode">
            <label class="radio-label">
              <input type="radio" :value="false" v-model="m.animated">
              <span>静态模型</span>
            </label>
            <label class="radio-label">
              <input type="radio" :value="true" v-model="m.animated">
              <span>动态模型（播放内置动画）</span>
            </label>
          </div>
          <div class="model-sliders">
            <div class="slider-group">
              <label>模型大小 <span class="slider-val">{{ m.scale.toFixed(1) }}x</span></label>
              <input type="range" min="0.3" max="3" step="0.1" v-model.number="m.scale" class="slider">
            </div>
            <div class="slider-group">
              <label>水平位置 <span class="slider-val">{{ m.posX.toFixed(1) }}</span></label>
              <input type="range" min="-5" max="5" step="0.1" v-model.number="m.posX" class="slider">
            </div>
            <div class="slider-group">
              <label>垂直位置 <span class="slider-val">{{ m.posY.toFixed(1) }}</span></label>
              <input type="range" min="-3" max="3" step="0.1" v-model.number="m.posY" class="slider">
            </div>
            <div class="slider-group">
              <label>远近距离 <span class="slider-val">{{ m.zoom.toFixed(1) }}</span></label>
              <input type="range" min="-3" max="3" step="0.1" v-model.number="m.zoom" class="slider">
            </div>
            <button type="button" @click="resetModelAt(idx)" class="btn-outline-sm">重置位置和大小</button>
          </div>
        </div>

        <label v-if="form.models.length < 5" class="upload-area-sm" :class="{ disabled: modelUploadingIdx !== -1 }">
          <input type="file" accept=".glb,.gltf" @change="handleAddModel" hidden :disabled="modelUploadingIdx !== -1">
          <span>{{ modelUploadingIdx !== -1 ? '上传中...' : '📎 添加模型' }}</span>
        </label>
        <p v-if="form.models.length >= 5" class="form-hint" style="margin:0;">已达到最大模型数量（5个）</p>
      </div>

      <div class="form-group">
        <label>网站图标 (Favicon SVG)</label>
        <p class="form-hint">上传 SVG 格式的图标，将作为浏览器标签页图标显示</p>
        <div class="favicon-row">
          <div v-if="form.faviconSvg" class="favicon-preview">
            <img :src="faviconDataUrl" alt="favicon" class="favicon-img">
            <button type="button" @click="form.faviconSvg = ''" class="favicon-remove">✕</button>
          </div>
          <label class="upload-area-sm">
            <input type="file" accept=".svg,image/svg+xml" @change="handleFaviconUpload" hidden>
            <span>{{ form.faviconSvg ? '更换图标' : '📎 上传 SVG' }}</span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <div class="about-header">
          <label>关于页面 (Markdown)</label>
          <div class="about-tabs">
            <button type="button" :class="{ active: aboutTab === 'edit' }" @click="aboutTab = 'edit'">编辑</button>
            <button type="button" :class="{ active: aboutTab === 'preview' }" @click="aboutTab = 'preview'">预览</button>
          </div>
        </div>
        <textarea v-if="aboutTab === 'edit'" v-model="form.about" rows="12" class="input-textarea"></textarea>
        <div v-else class="about-preview markdown-body" v-html="aboutPreview"></div>
      </div>

      <div class="form-section">
        <label>社交链接</label>
        <p class="form-hint">配置后显示在首页和关于页面的导航栏中，不配置则不展示</p>
        <div class="social-list">
          <div v-for="(item, i) in form.socialLinks" :key="i" class="social-item">
            <input v-model="item.label" placeholder="名称 (如 GitHub)" class="input-sm">
            <input v-model="item.url" placeholder="链接地址" class="input-sm input-wide">
            <button type="button" @click="removeSocial(i)" class="btn-icon btn-danger-icon">✕</button>
          </div>
        </div>
        <button type="button" @click="addSocial" class="btn-outline-sm">+ 添加链接</button>
      </div>

      <div class="form-section">
        <label>数据备份与恢复</label>
        <p class="form-hint">备份会导出所有文章、分类、设置、导航链接、评论及图片/模型文件数据为 JSON 文件。包含图片时文件可能较大，请耐心等待。恢复会覆盖当前数据。</p>
        <div class="backup-actions">
          <button type="button" class="btn-outline-sm" :disabled="backupBusy" @click="handleExport">
            {{ backupBusy === 'export' ? '导出中...' : '📦 一键备份' }}
          </button>
          <label class="btn-outline-sm btn-restore" :class="{ disabled: backupBusy }">
            <input type="file" accept=".json" @change="handleImport" hidden :disabled="!!backupBusy">
            {{ backupBusy === 'import' ? '恢复中...' : '📥 恢复数据' }}
          </label>
        </div>
        <p v-if="backupMsg" class="msg" :class="{ error: backupIsError }">{{ backupMsg }}</p>
      </div>

      <div class="form-group">
        <label>管理密码 (留空不修改)</label>
        <input v-model="form.password" type="password" class="input-field" placeholder="输入新密码">
      </div>
      <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? '保存中...' : '保存设置' }}</button>
      <p v-if="msg" class="msg" :class="{ error: isError }">{{ msg }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'
import Loading from '../../components/Loading.vue'
import { getSiteSettings, saveSettings, uploadImage, getBackupKeys, getBackupBatch, restoreBackupBatch } from '../../api'

const loading = ref(true)
const saving = ref(false)
const msg = ref('')
const isError = ref(false)
const form = ref({ siteName: '', pageTitle: '', subtitle: '', description: '', about: '', password: '', socialLinks: [], faviconSvg: '', navDockTitle: '', models: [], seoEnabled: false, seoDescription: '', seoKeywords: '', seoRobots: 'index, follow', icp: '', copyright: '' })
const modelUploadingIdx = ref(-1)
const aboutTab = ref('edit')

const faviconDataUrl = computed(() => {
  if (!form.value.faviconSvg) return ''
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(form.value.faviconSvg)))
})
const aboutPreview = computed(() => marked(form.value.about || '暂无内容'))

onMounted(async () => {
  try {
    const data = await getSiteSettings()
    form.value.siteName = data.siteName || ''
    form.value.pageTitle = data.pageTitle || ''
    form.value.subtitle = data.subtitle || ''
    form.value.description = data.description || ''
    form.value.about = data.about || ''
    form.value.socialLinks = data.socialLinks || []
    form.value.faviconSvg = data.faviconSvg || ''
    form.value.navDockTitle = data.navDockTitle || ''
    form.value.seoEnabled = data.seoEnabled || false
    form.value.seoDescription = data.seoDescription || ''
    form.value.seoKeywords = data.seoKeywords || ''
    form.value.seoRobots = data.seoRobots || 'index, follow'
    form.value.icp = data.icp || ''
    form.value.copyright = data.copyright || ''
    // 兼容旧的单模型数据格式
    if (data.models && data.models.length) {
      form.value.models = data.models.map(m => ({
        url: m.url || '', animated: m.animated || false,
        scale: m.scale ?? 1, posX: m.posX ?? 0, posY: m.posY ?? 0, zoom: m.zoom ?? 0
      }))
    } else if (data.modelUrl) {
      form.value.models = [{
        url: data.modelUrl, animated: data.modelAnimated || false,
        scale: data.modelScale ?? 1, posX: data.modelPosX ?? 0, posY: data.modelPosY ?? 0, zoom: data.modelZoom ?? 0
      }]
    } else {
      form.value.models = []
    }
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})

function addSocial() { form.value.socialLinks.push({ label: '', url: '' }) }
function removeSocial(i) { form.value.socialLinks.splice(i, 1) }

function handleFaviconUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
    msg.value = '请上传 SVG 格式文件'
    isError.value = true
    return
  }
  const reader = new FileReader()
  reader.onload = () => { form.value.faviconSvg = reader.result }
  reader.readAsText(file)
}

async function validateAndUploadModel(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (!['glb', 'gltf'].includes(ext)) {
    msg.value = '请上传 GLB 或 GLTF 格式文件'
    isError.value = true
    return null
  }
  if (file.size > 10 * 1024 * 1024) {
    msg.value = '模型文件不能超过 10MB'
    isError.value = true
    return null
  }
  msg.value = ''
  isError.value = false
  const res = await uploadImage(file)
  if (res.error) throw new Error(res.error)
  return res.url
}

async function handleAddModel(e) {
  const file = e.target.files[0]
  if (!file) return
  modelUploadingIdx.value = form.value.models.length
  try {
    const url = await validateAndUploadModel(file)
    if (url) {
      form.value.models.push({ url, animated: false, scale: 1, posX: 0, posY: 0, zoom: 0 })
    }
  } catch (err) {
    msg.value = '模型上传失败: ' + err.message
    isError.value = true
  } finally {
    modelUploadingIdx.value = -1
    e.target.value = ''
  }
}

async function handleModelUploadAt(e, idx) {
  const file = e.target.files[0]
  if (!file) return
  modelUploadingIdx.value = idx
  try {
    const url = await validateAndUploadModel(file)
    if (url) form.value.models[idx].url = url
  } catch (err) {
    msg.value = '模型上传失败: ' + err.message
    isError.value = true
  } finally {
    modelUploadingIdx.value = -1
    e.target.value = ''
  }
}

function removeModelAt(idx) {
  form.value.models.splice(idx, 1)
}

function resetModelAt(idx) {
  const m = form.value.models[idx]
  m.scale = 1; m.posX = 0; m.posY = 0; m.zoom = 0
}

async function handleSave() {
  saving.value = true; msg.value = ''; isError.value = false
  try {
    const payload = { ...form.value }
    if (!payload.password) delete payload.password
    await saveSettings(payload)
    msg.value = '保存成功'
    form.value.password = ''
    // Apply favicon immediately
    if (form.value.faviconSvg) {
      applyFavicon(form.value.faviconSvg)
    }
  } catch (e) { msg.value = e.message; isError.value = true }
  finally { saving.value = false }
}

function applyFavicon(svgStr) {
  const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)))
  let link = document.querySelector("link[rel*='icon']")
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link) }
  link.type = 'image/svg+xml'
  link.href = url
}

const backupBusy = ref(false)
const backupMsg = ref('')
const backupIsError = ref(false)

async function handleExport() {
  backupBusy.value = 'export'
  backupMsg.value = ''
  backupIsError.value = false
  try {
    // 第一步：获取所有需要备份的 key 列表
    backupMsg.value = '正在获取数据列表...'
    const { keys } = await getBackupKeys()
    if (!keys || !keys.length) throw new Error('没有可备份的数据')

    // 第二步：分批读取数据（每批 5 个 key）
    const BATCH = 5
    const allData = {}
    for (let i = 0; i < keys.length; i += BATCH) {
      const batch = keys.slice(i, i + BATCH)
      backupMsg.value = `正在导出数据 ${Math.min(i + BATCH, keys.length)}/${keys.length}...`
      const res = await getBackupBatch(batch)
      Object.assign(allData, res.data)
    }

    const backup = { version: 2, createdAt: new Date().toISOString(), data: allData }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blog-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    backupMsg.value = `备份完成，共导出 ${keys.length} 个数据项`
  } catch (e) {
    backupMsg.value = '备份失败: ' + e.message
    backupIsError.value = true
  } finally {
    backupBusy.value = false
  }
}

async function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return
  backupBusy.value = 'import'
  backupMsg.value = ''
  backupIsError.value = false
  try {
    const text = await file.text()
    const backup = JSON.parse(text)
    if (!backup.data) throw new Error('无效的备份文件格式')

    const keys = Object.keys(backup.data)
    if (!keys.length) throw new Error('备份文件中没有数据')

    // 分批恢复（每批 3 个 key，避免阿里云 KV 调用限制）
    const BATCH = 3
    let restored = 0
    for (let i = 0; i < keys.length; i += BATCH) {
      const batchKeys = keys.slice(i, i + BATCH)
      const batchData = {}
      batchKeys.forEach(k => { batchData[k] = backup.data[k] })
      backupMsg.value = `正在恢复数据 ${Math.min(i + BATCH, keys.length)}/${keys.length}...`
      await restoreBackupBatch(batchData)
      restored += batchKeys.length
    }

    backupMsg.value = `恢复成功，已恢复 ${restored} 个数据项，刷新页面生效`
  } catch (e) {
    backupMsg.value = '恢复失败: ' + e.message
    backupIsError.value = true
  } finally {
    backupBusy.value = false
    e.target.value = ''
  }
}
</script>

<style scoped>
h1 { font-size: 1.6rem; font-weight: 600; margin-bottom: 2rem; letter-spacing: -0.02em; }
.settings-form { max-width: 600px; display: flex; flex-direction: column; gap: 1.2rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label, .form-section > label { font-size: 0.8rem; color: var(--text-dim); font-weight: 500; }
.form-hint { font-size: 0.7rem; color: var(--text-muted); margin: 0.2rem 0 0.5rem; }
.form-section { display: flex; flex-direction: column; gap: 0.4rem; padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; }
.input-field, .input-textarea {
  padding: 0.7rem 1rem; background: var(--bg-input); border: 1px solid var(--border);
  border-radius: 10px; color: var(--text); font-size: 0.85rem; outline: none;
  transition: border-color 0.3s; font-family: var(--font);
}
.input-textarea { resize: vertical; line-height: 1.6; }
.input-field:focus, .input-textarea:focus { border-color: var(--accent); }
.favicon-row { display: flex; align-items: center; gap: 1rem; }
.favicon-preview { position: relative; width: 48px; height: 48px; border-radius: 10px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; background: var(--bg-input); }
.favicon-img { width: 32px; height: 32px; }
.favicon-remove {
  position: absolute; top: -6px; right: -6px; width: 18px; height: 18px;
  background: rgba(0,0,0,0.6); border: none; color: white; border-radius: 50%;
  cursor: pointer; font-size: 0.55rem; display: flex; align-items: center; justify-content: center;
}
.upload-area-sm {
  display: inline-flex; align-items: center; padding: 0.5rem 1rem;
  border: 1px dashed var(--border); border-radius: 10px; cursor: pointer;
  font-size: 0.78rem; color: var(--text-muted); transition: all 0.3s;
}
.upload-area-sm:hover { border-color: var(--accent); color: var(--accent); }
.upload-area-sm.disabled { opacity: 0.5; cursor: not-allowed; }
.model-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.model-info { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.8rem; background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px; }
.model-file { font-size: 0.78rem; color: var(--text-dim); }
.model-mode { display: flex; gap: 1.2rem; margin-top: 0.5rem; }
.model-item { display: flex; flex-direction: column; gap: 0.4rem; padding: 0.8rem; background: var(--bg-input); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 0.5rem; }
.model-item-header { display: flex; justify-content: space-between; align-items: center; }
.model-item-title { font-size: 0.8rem; font-weight: 600; color: var(--text); }
.radio-label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--text-dim); cursor: pointer; }
.radio-label input[type="radio"] { accent-color: var(--accent); }
.toggle-row { display: flex; flex-direction: column; gap: 0.3rem; }
.toggle-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.toggle-label input[type="checkbox"] { accent-color: var(--accent); width: 16px; height: 16px; }
.toggle-text { font-size: 0.8rem; color: var(--text); font-weight: 500; }
.model-sliders { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid var(--border); }
.slider-group { display: flex; flex-direction: column; gap: 0.25rem; }
.slider-group label { font-size: 0.75rem; color: var(--text-dim); display: flex; justify-content: space-between; }
.slider-val { color: var(--accent); font-variant-numeric: tabular-nums; }
.slider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; background: var(--bg-input); outline: none; }
.slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--accent); cursor: pointer; }
.slider::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--accent); cursor: pointer; border: none; }
.social-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.5rem; }
.social-item { display: flex; gap: 0.5rem; align-items: center; }
.input-sm {
  padding: 0.5rem 0.7rem; background: var(--bg-input); border: 1px solid var(--border);
  border-radius: 8px; color: var(--text); font-size: 0.8rem; outline: none; font-family: var(--font); flex: 1;
}
.input-wide { flex: 2; }
.input-sm:focus { border-color: var(--accent); }
.btn-icon {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px;
  color: var(--text-dim); cursor: pointer; font-size: 0.8rem; transition: all 0.2s; flex-shrink: 0; font-family: var(--font);
}
.btn-danger-icon:hover { border-color: var(--danger); color: var(--danger); }
.btn-outline-sm {
  align-self: flex-start; padding: 0.4rem 1rem; background: transparent; border: 1px dashed var(--border);
  color: var(--text-muted); border-radius: 8px; font-size: 0.75rem; cursor: pointer; transition: all 0.3s; font-family: var(--font);
}
.btn-outline-sm:hover { border-color: var(--accent); color: var(--accent); }
.btn-primary {
  align-self: flex-start; padding: 0.7rem 2rem; background: var(--accent); color: var(--bg);
  border: none; border-radius: 10px; font-size: 0.85rem; font-weight: 500;
  cursor: pointer; transition: background 0.3s; font-family: var(--font);
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.msg { font-size: 0.85rem; color: var(--success); }
.msg.error { color: var(--danger); }
.backup-actions { display: flex; gap: 0.8rem; flex-wrap: wrap; margin-top: 0.3rem; }
.btn-restore { cursor: pointer; }
.btn-restore.disabled { opacity: 0.5; cursor: not-allowed; }
.about-header { display: flex; justify-content: space-between; align-items: center; }
.about-tabs { display: flex; gap: 0.3rem; }
.about-tabs button { padding: 0.25rem 0.7rem; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text-muted); font-size: 0.72rem; cursor: pointer; transition: all 0.2s; font-family: var(--font); }
.about-tabs button.active { background: var(--accent); color: var(--bg); border-color: var(--accent); }
.about-preview { padding: 0.8rem 1rem; background: var(--bg-input); border: 1px solid var(--border); border-radius: 10px; min-height: 200px; font-size: 0.85rem; line-height: 1.7; overflow-y: auto; max-height: 400px; }
.about-preview :deep(h1), .about-preview :deep(h2), .about-preview :deep(h3) { margin: 1.2rem 0 0.6rem; font-weight: 600; }
.about-preview :deep(h2) { font-size: 1.3rem; }
.about-preview :deep(h3) { font-size: 1.1rem; }
.about-preview :deep(p) { margin-bottom: 0.8rem; }
.about-preview :deep(a) { color: var(--accent); }
.about-preview :deep(pre) { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; padding: 0.8rem; overflow-x: auto; margin: 1rem 0; }
.about-preview :deep(code) { font-size: 0.82em; font-family: 'Fira Code', monospace; }
.about-preview :deep(:not(pre) > code) { background: var(--bg-input); padding: 0.15em 0.4em; border-radius: 4px; }
.about-preview :deep(blockquote) { border-left: 3px solid var(--accent); padding-left: 1rem; margin: 1rem 0; color: var(--text-dim); }
.about-preview :deep(ul), .about-preview :deep(ol) { padding-left: 1.5rem; margin-bottom: 0.8rem; }
.about-preview :deep(li) { margin-bottom: 0.3rem; }
.about-preview :deep(hr) { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }
.about-preview :deep(img) { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
</style>
