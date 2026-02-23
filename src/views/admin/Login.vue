<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <span class="logo-icon">✦</span>
      </div>
      <h2>Blog<span class="dot">.</span></h2>
      <p class="login-hint">输入管理密码登录后台</p>
      <form @submit.prevent="handleLogin">
        <input v-model="password" type="password" placeholder="管理密码" autocomplete="current-password" required>
        <button type="submit" :disabled="submitting">{{ submitting ? '登录中...' : '登录' }}</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../../api'

const router = useRouter()
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function handleLogin() {
  error.value = ''
  submitting.value = true
  try {
    const data = await login(password.value)
    localStorage.setItem('blog_token', data.token)
    router.push('/admin')
  } catch (e) {
    error.value = e.message || '密码错误'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--bg);
}
.login-card {
  width: 380px; padding: 2.5rem; background: var(--bg-surface);
  border: 1px solid var(--border); border-radius: 20px; text-align: center;
}
.login-logo {
  display: inline-flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 14px;
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  color: #fff; font-size: 1.2rem; margin-bottom: 1rem;
}
.logo-icon { font-size: 1.2rem; }
.login-card h2 { font-size: 1.8rem; font-weight: 300; margin-bottom: 0.5rem; }
.dot { color: var(--accent); }
.login-hint { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2rem; }
form { display: flex; flex-direction: column; gap: 1rem; }
input {
  width: 100%; padding: 0.8rem 1rem; background: var(--bg-input); border: 1px solid var(--border);
  border-radius: 10px; color: var(--text); font-size: 0.9rem; outline: none;
  transition: border-color 0.3s; font-family: var(--font);
}
input:focus { border-color: var(--accent); }
button {
  padding: 0.8rem; background: var(--accent); color: var(--bg); border: none;
  border-radius: 10px; font-size: 0.9rem; font-weight: 500; cursor: pointer;
  transition: background 0.3s; font-family: var(--font);
}
button:hover { background: var(--accent-hover); }
button:disabled { opacity: 0.6; cursor: not-allowed; }
.error { color: var(--danger); font-size: 0.8rem; margin-top: 1rem; }
</style>
