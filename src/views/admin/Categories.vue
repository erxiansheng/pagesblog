<template>
  <div class="categories-page">
    <h1>分类管理</h1>
    <form @submit.prevent="addCategory" class="add-form">
      <input v-model="newCat" placeholder="新分类名称" class="input-field">
      <button type="submit" class="btn-primary">添加</button>
    </form>
    <Loading v-if="loading" />
    <div v-else class="cat-list">
      <div v-for="cat in categories" :key="cat" class="cat-item">
        <span>{{ cat }}</span>
        <button @click="handleDelete(cat)" class="btn-sm btn-danger">删除</button>
      </div>
      <div v-if="!categories.length" class="empty">暂无分类</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Loading from '../../components/Loading.vue'
import { getCategories, saveCategory, deleteCategory } from '../../api'

const categories = ref([])
const newCat = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const data = await getCategories()
    categories.value = data.categories || []
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function addCategory() {
  if (!newCat.value.trim()) return
  try {
    await saveCategory({ name: newCat.value.trim() })
    newCat.value = ''
    await load()
  } catch (e) { alert(e.message) }
}

async function handleDelete(name) {
  if (!confirm(`确定删除分类「${name}」？`)) return
  try {
    await deleteCategory(name)
    categories.value = categories.value.filter(c => c !== name)
  } catch (e) { alert(e.message) }
}

onMounted(load)
</script>

<style scoped>
h1 { font-size: 1.5rem; font-weight: 500; margin-bottom: 1.5rem; }
.add-form { display: flex; gap: 0.8rem; margin-bottom: 2rem; }
.input-field {
  flex: 1; padding: 0.7rem 1rem; background: var(--bg-input); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text); font-size: 0.85rem; outline: none;
  font-family: var(--font);
}
.input-field:focus { border-color: var(--accent); }
.btn-primary {
  padding: 0.7rem 1.5rem; background: var(--accent); color: var(--bg); border: none;
  border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500; cursor: pointer;
  font-family: var(--font);
}
.cat-list { display: flex; flex-direction: column; gap: 0.5rem; }
.cat-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.8rem 1.2rem; background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-sm); font-size: 0.9rem;
}
.btn-sm {
  padding: 0.3rem 0.8rem; font-size: 0.75rem; border-radius: 6px;
  background: var(--bg-input); border: 1px solid var(--border); color: var(--text-dim);
  cursor: pointer; transition: all 0.3s; font-family: var(--font);
}
.btn-danger:hover { border-color: var(--danger); color: var(--danger); }
.empty { text-align: center; padding: 3rem 0; color: var(--text-muted); }
</style>
