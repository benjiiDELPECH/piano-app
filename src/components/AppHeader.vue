<script setup lang="ts">
import { computed } from 'vue'
import { useAdaptive } from '@/composables/useAdaptive'

const adaptive = useAdaptive()
const stats = computed(() => adaptive.getStats())

function handleReset() {
  if (confirm('⚠️ Réinitialiser toute ta progression ? Cette action est irréversible.')) {
    adaptive.reset()
  }
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <h1>🎹 PianoFlow</h1>
      <span class="tagline">Apprentissage adaptatif &amp; gratuit</span>
    </div>
    <div class="header-right">
      <div class="stat-pill">
        <span class="stat-label">Niveau</span>
        <span class="stat-value">{{ stats.level }}</span>
      </div>
      <div class="stat-pill">
        <span class="stat-label">XP</span>
        <span class="stat-value">{{ stats.totalXp }}</span>
      </div>
      <div class="stat-pill">
        <span class="stat-label">Série</span>
        <span class="stat-value">{{ stats.streak }} 🔥</span>
      </div>
      <button class="btn-icon" title="Réinitialiser la progression" @click="handleReset">↺</button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
}

.header-left h1 {
  font-size: 1.4rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-light), var(--success));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-left: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 14px;
  min-width: 60px;
}

.stat-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary-light);
}

.btn-icon {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 1.2rem;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--bg-card-hover);
  color: var(--text);
}

@media (max-width: 600px) {
  .app-header {
    flex-direction: column;
    gap: 10px;
  }
  .stat-pill {
    padding: 4px 8px;
  }
}
</style>
