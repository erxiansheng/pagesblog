<template>
  <div class="editor-page">
    <div class="editor-header">
      <h1>{{ isEdit ? '编辑文章' : '写新文章' }}</h1>
      <div class="editor-actions">
        <button @click="save(false)" class="btn-outline" :disabled="saving">存为草稿</button>
        <button @click="save(true)" class="btn-primary" :disabled="saving">{{ saving ? '保存中...' : '发布' }}</button>
      </div>
    </div>

    <div class="editor-form">
      <input v-model="form.title" placeholder="文章标题" class="input-title">

      <div class="form-row">
        <select v-model="form.category" class="input-select">
          <option value="">选择分类</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        <input v-model="form.tags" placeholder="标签 (逗号分隔)" class="input-field">
      </div>

      <input v-model="form.summary" placeholder="文章摘要" class="input-field">

      <div class="form-options">
        <label class="checkbox-label">
          <input type="checkbox" v-model="form.showOnHome">
          <span>展示在首页</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="form.commentsEnabled">
          <span>允许评论</span>
        </label>
      </div>

      <div class="cover-section">
        <div v-if="form.cover" class="cover-preview">
          <img :src="form.cover" alt="封面">
          <button @click="form.cover = ''" class="cover-remove">✕</button>
        </div>
        <label class="upload-btn">
          <input type="file" accept="image/*" @change="handleCoverUpload" hidden>
          📷 {{ form.cover ? '更换封面' : '上传封面图' }}
        </label>
      </div>

      <div class="editor-area">
        <div class="editor-toolbar">
          <button @click="insertMd('**', '**')" title="粗体">B</button>
          <button @click="insertMd('*', '*')" title="斜体"><em>I</em></button>
          <button @click="insertMd('## ', '')" title="标题">H</button>
          <button @click="insertMd('`', '`')" title="代码">&lt;/&gt;</button>
          <button @click="insertMd('\n```\n', '\n```\n')" title="代码块">{ }</button>
          <button @click="insertMd('[', '](url)')" title="链接">🔗</button>
          <label title="插入图片" class="toolbar-upload">
            <input type="file" accept="image/*" @change="handleImageInsert" hidden>
            🖼️
          </label>
          <button @click="insertMd('> ', '')" title="引用">❝</button>
          <button @click="insertMd('- ', '')" title="列表">•</button>
          <button @click="insertMd('---\n', '')" title="分割线">—</button>
          <span class="toolbar-spacer"></span>
          <button @click="showPreview = !showPreview" :class="{ active: showPreview }">👁️ 预览</button>
        </div>
        <div class="editor-body" :class="{ split: showPreview }">
          <textarea ref="textareaRef" v-model="form.content" placeholder="使用 Markdown 编写内容..." class="editor-textarea"></textarea>
          <div v-if="showPreview" class="editor-preview markdown-body" v-html="previewHtml"></div>
        </div>
      </div>
    </div>

    <p v-if="error" class="error-msg">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { getPost, createPost, updatePost, uploadImage, getCategories } from '../../api'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const textareaRef = ref(null)
const showPreview = ref(false)
const saving = ref(false)
const error = ref('')
const categories = ref([])

const form = ref({
  title: '', summary: '', content: '', category: '', tags: '', cover: '', published: false, showOnHome: false, commentsEnabled: true
})

const previewHtml = computed(() => marked(form.value.content || ''))

onMounted(async () => {
  try {
    const catsData = await getCategories()
    categories.value = catsData.categories || []
  } catch (e) { /* ignore */ }

  if (route.params.id) {
    try {
      const data = await getPost(route.params.id)
      const p = data.post
      form.value = {
        title: p.title, summary: p.summary || '', content: p.content || '',
        category: p.category || '', tags: (p.tags || []).join(', '),
        cover: p.cover || '', published: p.published, showOnHome: p.showOnHome || false,
        commentsEnabled: p.commentsEnabled !== false
      }
    } catch (e) { error.value = '加载文章失败' }
  }
})

function insertMd(before, after) {
  const ta = textareaRef.value
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const text = form.value.content
  const selected = text.substring(start, end)
  form.value.content = text.substring(0, start) + before + selected + after + text.substring(end)
  ta.focus()
  const newPos = start + before.length + selected.length
  requestAnimationFrame(() => ta.setSelectionRange(newPos, newPos))
}

async function handleCoverUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const data = await uploadImage(file)
    form.value.cover = data.url
  } catch (err) { error.value = '上传失败' }
}

async function handleImageInsert(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const data = await uploadImage(file)
    insertMd(`![${file.name}](${data.url})`, '')
  } catch (err) { error.value = '上传失败' }
}

async function save(publish) {
  if (!form.value.title.trim()) { error.value = '请输入标题'; return }
  saving.value = true
  error.value = ''
  const payload = {
    ...form.value,
    published: publish,
    tags: form.value.tags ? form.value.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  }
  try {
    if (isEdit.value) {
      await updatePost(route.params.id, payload)
    } else {
      await createPost(payload)
    }
    router.push('/admin/posts')
  } catch (e) { error.value = e.message }
  finally { saving.value = false }
}
</script>

<style scoped>
.editor-page { max-width: 960px; }
.editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.editor-header h1 { font-size: 1.5rem; font-weight: 500; }
.editor-actions { display: flex; gap: 0.5rem; }
.btn-outline {
  padding: 0.6rem 1.2rem; background: transparent; border: 1px solid var(--border);
  color: var(--text-dim); border-radius: var(--radius-sm); font-size: 0.85rem; cursor: pointer;
  transition: all 0.3s; font-family: var(--font);
}
.btn-outline:hover { border-color: var(--text-dim); color: var(--text); }
.btn-primary {
  padding: 0.6rem 1.2rem; background: var(--accent); color: var(--bg); border: none;
  border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500; cursor: pointer;
  transition: background 0.3s; font-family: var(--font);
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:disabled, .btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }

.editor-form { display: flex; flex-direction: column; gap: 1rem; }
.input-title {
  width: 100%; padding: 0.8rem 0; background: transparent; border: none; border-bottom: 1px solid var(--border);
  color: var(--text); font-size: 1.5rem; font-weight: 500; outline: none; font-family: var(--font);
  transition: border-color 0.3s;
}
.input-title:focus { border-bottom-color: var(--accent); }
.form-row { display: flex; gap: 1rem; }
.input-field, .input-select {
  flex: 1; padding: 0.7rem 1rem; background: var(--bg-input); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text); font-size: 0.85rem; outline: none;
  transition: border-color 0.3s; font-family: var(--font);
}
.input-field:focus, .input-select:focus { border-color: var(--accent); }
.input-select option { background: var(--bg-surface); }

.cover-section { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }

.form-options { display: flex; align-items: center; gap: 1.5rem; }
.checkbox-label {
  display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;
  color: var(--text-dim); cursor: pointer; user-select: none;
}
.checkbox-label input[type="checkbox"] {
  width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer;
}
.cover-preview { position: relative; width: 200px; height: 120px; border-radius: var(--radius-sm); overflow: hidden; }
.cover-preview img { width: 100%; height: 100%; object-fit: cover; }
.cover-remove {
  position: absolute; top: 4px; right: 4px; width: 24px; height: 24px;
  background: rgba(0,0,0,0.6); border: none; color: white; border-radius: 50%;
  cursor: pointer; font-size: 0.7rem; display: flex; align-items: center; justify-content: center;
}
.upload-btn {
  padding: 0.6rem 1rem; background: var(--bg-input); border: 1px dashed var(--border);
  border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--text-dim); cursor: pointer;
  transition: all 0.3s;
}
.upload-btn:hover { border-color: var(--accent); color: var(--accent); }

.editor-area { border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
.editor-toolbar {
  display: flex; align-items: center; gap: 0.2rem; padding: 0.5rem 0.8rem;
  background: var(--bg-surface); border-bottom: 1px solid var(--border); flex-wrap: wrap;
}
.editor-toolbar button, .toolbar-upload {
  padding: 0.3rem 0.5rem; background: none; border: none; color: var(--text-dim);
  cursor: pointer; border-radius: 4px; font-size: 0.8rem; transition: all 0.2s;
  font-family: var(--font); display: inline-flex; align-items: center;
}
.editor-toolbar button:hover, .toolbar-upload:hover { background: var(--bg-input); color: var(--text); }
.editor-toolbar button.active { background: rgba(201,169,110,0.15); color: var(--accent); }
.toolbar-spacer { flex: 1; }

.editor-body { display: flex; min-height: 400px; }
.editor-body.split .editor-textarea { width: 50%; border-right: 1px solid var(--border); }
.editor-textarea {
  width: 100%; min-height: 400px; padding: 1rem; background: transparent;
  border: none; color: var(--text); font-size: 0.9rem; line-height: 1.7;
  resize: vertical; outline: none; font-family: 'Fira Code', monospace;
}
.editor-preview { width: 50%; padding: 1rem; overflow-y: auto; max-height: 500px; }
.error-msg { color: var(--danger); font-size: 0.85rem; margin-top: 1rem; }

@media (max-width: 600px) {
  .form-row { flex-direction: column; }
  .editor-body.split { flex-direction: column; }
  .editor-body.split .editor-textarea, .editor-preview { width: 100%; }
}
</style>
