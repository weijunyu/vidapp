<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  stream: MediaStream | null;
  isRecording: boolean;
  currentDuration: string;
}>();

const videoElement = ref<HTMLVideoElement | null>(null);

// Watch for stream changes and update video source
watch(
  () => props.stream,
  (newStream) => {
    if (videoElement.value) {
      videoElement.value.srcObject = newStream;
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="video-preview">
    <video ref="videoElement" autoplay muted playsinline></video>
    <div v-if="isRecording" class="recording-timer">
      {{ currentDuration }}
    </div>
  </div>
</template>

<style scoped>
.video-preview {
  width: 100%;
  position: relative;
}

video {
  width: 100%;
  max-width: 640px;
  border-radius: 8px;
  background-color: #000;
}

.recording-timer {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: rgba(0, 0, 0, 0.7);
  color: #ff4444;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 1.2rem;
}

@media (prefers-color-scheme: light) {
  .recording-timer {
    background-color: rgba(255, 255, 255, 0.9);
    color: #ff1744;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

@media (max-width: 768px) {
  .recording-timer {
    font-size: 1rem;
    padding: 0.25rem 0.75rem;
  }
}
</style>
