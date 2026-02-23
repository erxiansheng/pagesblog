<template>
  <div class="navlinks-page">
    <h1>导航管理</h1>
    <p class="hint">导航卡片显示在首页右侧，风格与文章卡片一致。</p>

    <Loading v-if="loading" />
    <div v-else>
      <div class="links-list">
        <div v-for="(link, i) in links" :key="i" class="link-item">
          <div class="link-top">
            <div class="link-preview" v-if="link.image">
              <img :src="link.image" :alt="link.name">
              <button @click="link.image = ''" class="preview-remove">✕</button>
            </div>
            <label v-else class="upload-area">
              <input type="file" accept="image/*" @change="e => handleUpload(e, i)" hidden>
              <span>📷 上传图片</span>
            </label>
          </div>
          <div class="link-fields">
            <input v-model="link.name" placeholder="名称" class="input-sm">
            <input v-model="link.desc" placeholder="描述" class="input-sm">
            <input v-model="link.url" placeholder="链接地址" class="input-sm input-wide">
            <label class="checkbox-label">
              <input type="checkbox" v-model="link.external"> 新窗口
            </label>
          </div>
          <div class="link-actions">
            <button @click="moveUp(i)" :disabled="i === 0" class="btn-icon">↑</button>
            <button @click="moveDown(i)" :disabled="i === links.length - 1" class="btn-icon">↓</button>
            <button @click="removeLink(i)" class="btn-icon btn-danger-icon">✕</button>
          </div>
        </div>
      </div>

      <div class="bottom-actions">
        <button @click="addLink" class="btn-outline">+ 添加导航</button>
        <button @click="handleSave" class="btn-primary" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
      </div>
      <p v-if="msg" class="msg" :class="{ error: isError }">{{ msg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Loading from '../../components/Loading.vue'
import { getAdminNavLinks, saveNavLinks, uploadImage } from '../../api'

const links = ref([])
const loading = ref(true)
const saving = ref(false)
const msg = ref('')
const isError = ref(false)

onMounted(async () => {
  try {
    const data = await getAdminNavLinks()
    links.value = data.links || []
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})

function addLink() {
  links.value.push({ name: '', desc: '', url: '', image: '', external: true })
}
function removeLink(i) { links.value.splice(i, 1) }
function moveUp(i) {
  if (i <= 0) return
  ;[links.value[i], links.value[i - 1]] = [links.value[i - 1], links.value[i]]
}
function moveDown(i) {
  if (i >= links.value.length - 1) return
  ;[links.value[i], links.value[i + 1]] = [links.value[i + 1], links.value[i]]
}

async function handleUpload(e, index) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const data = await uploadImage(file)
    links.value[index].image = data.url
  } catch (err) {
    msg.value = '图片上传失败'
    isError.value = true
  }
}

async function handleSave() {
  saving.value = true; msg.value = ''; isError.value = false
  try {
    await saveNavLinks(links.value)
    msg.value = '保存成功'
  } catch (e) { msg.value = e.message; isError.value = true }
  finally { saving.value = false }
}
</script>

<style scoped>
h1 { font-size: 1.5rem; font-weight: 500; margin-bottom: 0.5rem; }
.hint { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2rem; }
.links-list { display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.5rem; }
.link-item {
  display: flex; gap: 1rem; padding: 1rem;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm);
}
.link-top { flex-shrink: 0; }
.link-preview { position: relative; width: 80px; height: 60px; border-radius: 6px; overflow: hidden; }
.link-preview img { width: 100%; height: 100%; object-fit: cover; }
.preview-remove {
  position: absolute; top: 2px; right: 2px; width: 18px; height: 18px;
  background: rgba(0,0,0,0.6); border: none; color: white; border-radius: 50%;
  cursor: pointer; font-size: 0.6rem; display: flex; align-items: center; justify-content: center;
}
.upload-area {
  display: flex; align-items: center; justify-content: center;
  width: 80px; height: 60px; border: 1px dashed var(--border); border-radius: 6px;
  cursor: pointer; transition: all 0.3s;
}
.upload-area span { font-size: 0.65rem; color: var(--text-muted); text-align: center; }
.upload-area:hover { border-color: var(--accent); }
.upload-area:hover span { color: var(--accent); }
.link-fields { display: flex; flex-wrap: wrap; gap: 0.5rem; flex: 1; align-content: flex-start; }
.input-sm {
  padding: 0.5rem 0.7rem; background: var(--bg-input); border: 1px solid var(--border);
  border-radius: 6px; color: var(--text); font-size: 0.8rem; outline: none; font-family: var(--font);
  min-width: 100px; flex: 1;
}
.input-wide { min-width: 180px; flex: 2; }
.input-sm:focus { border-color: var(--accent); }
.input-sm option { background: var(--bg-surface); }
.checkbox-label { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: var(--text-dim); white-space: nowrap; }
.link-actions { display: flex; flex-direction: column; gap: 0.3rem; flex-shrink: 0; }
.btn-icon {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px;
  color: var(--text-dim); cursor: pointer; font-size: 0.8rem; transition: all 0.2s; font-family: var(--font);
}
.btn-icon:hover { border-color: var(--accent); color: var(--accent); }
.btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-danger-icon:hover { border-color: var(--danger); color: var(--danger); }
.bottom-actions { display: flex; gap: 1rem; align-items: center; }
.btn-outline {
  padding: 0.6rem 1.2rem; background: transparent; border: 1px solid var(--border);
  color: var(--text-dim); border-radius: var(--radius-sm); font-size: 0.85rem; cursor: pointer;
  transition: all 0.3s; font-family: var(--font);
}
.btn-outline:hover { border-color: var(--accent); color: var(--accent); }
.btn-primary {
  padding: 0.6rem 1.5rem; background: var(--accent); color: var(--bg); border: none;
  border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500; cursor: pointer;
  transition: background 0.3s; font-family: var(--font);
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.msg { font-size: 0.85rem; color: var(--success); margin-top: 1rem; }
.msg.error { color: var(--danger); }

@media (max-width: 600px) {
  .link-item { flex-direction: column; }
  .link-actions { flex-direction: row; align-self: flex-end; }
}
</style>
