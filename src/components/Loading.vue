<template>
  <div class="loading">
    <div class="loading-spinner"></div>
  </div>
</template>

<style scoped>
.loading { display: flex; justify-content: center; padding: 4rem 0; }
.loading-spinner {
  width: 32px; height: 32px; border: 2px solid var(--border);
  border-top-color: var(--accent); border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
