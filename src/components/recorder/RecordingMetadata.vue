<script setup lang="ts">
defineProps<{
  metadata: {
    size: string;
    type: string;
    duration: string;
  } | null;
}>();
</script>

<template>
  <div v-if="metadata" class="metadata">
    <h3>Last Recording Details:</h3>
    <ul>
      <li>Size: {{ metadata.size }}</li>
      <li>Format: {{ metadata.type }}</li>
      <li>Duration: {{ metadata.duration }}</li>
    </ul>
  </div>
</template>

<style scoped>
.metadata {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #2d2d2d;
  border-radius: 4px;
  width: 100%;
  max-width: 640px;
}

.metadata h3 {
  margin: 0 0 0.5rem 0;
  color: #e0e0e0;
}

.metadata ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.metadata li {
  margin: 0.25rem 0;
  color: #90a4ae;
}

@media (prefers-color-scheme: light) {
  .metadata {
    background-color: #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .metadata h3 {
    color: #1a1a1a;
  }

  .metadata li {
    color: #666666;
  }
}

@media (max-width: 768px) {
  .metadata {
    font-size: 0.9rem;
  }
}
</style>
