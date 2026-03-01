<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  count: number
}>()

const starArray = computed(() => {
  return [1, 2, 3].map(i => i <= props.count)
})
</script>

<template>
  <div class="star-rating">
    <span
      v-for="(filled, i) in starArray"
      :key="i"
      class="star"
      :class="{ filled }"
      :style="{ animationDelay: `${i * 0.2}s` }"
    >
      {{ filled ? '★' : '☆' }}
    </span>
  </div>
</template>

<style scoped>
.star-rating {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.star {
  font-size: 2.5rem;
  opacity: 0;
  animation: star-appear 0.5s ease forwards;
}

.star.filled {
  color: #feca57;
  text-shadow: 0 0 16px rgba(254, 202, 87, 0.5);
  animation: star-filled 0.6s ease forwards;
}

@keyframes star-appear {
  0% { opacity: 0; transform: scale(0) rotate(-30deg); }
  60% { transform: scale(1.2) rotate(10deg); }
  100% { opacity: 1; transform: scale(1) rotate(0); }
}

@keyframes star-filled {
  0% { opacity: 0; transform: scale(0) rotate(-30deg); }
  50% { transform: scale(1.4) rotate(10deg); }
  70% { transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1) rotate(0); }
}
</style>
