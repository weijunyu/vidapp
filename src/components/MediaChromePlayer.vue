<script setup lang="ts">
import "media-chrome";

import { ref } from "vue";

const props = defineProps<{
  src: string;
  onTimeUpdate?: (event: Event) => void;
}>();

const emit = defineEmits<{
  (e: "timeupdate", event: Event): void;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);

// Forward the timeupdate event
function handleTimeUpdate(event: Event) {
  emit("timeupdate", event);
  props.onTimeUpdate?.(event);
}

// Expose methods that match the native video element
defineExpose({
  get currentTime() {
    return videoRef.value?.currentTime ?? 0;
  },
  set currentTime(value: number) {
    if (videoRef.value) {
      videoRef.value.currentTime = value;
    }
  },
  get duration() {
    return videoRef.value?.duration ?? 0;
  },
  pause() {
    videoRef.value?.pause();
  },
  play() {
    return videoRef.value?.play();
  },
});
</script>

<template>
  <media-controller>
    <video
      ref="videoRef"
      slot="media"
      class="player"
      :src="src"
      @timeupdate="handleTimeUpdate"
      playsinline
      preload="metadata"
    ></video>
    <media-control-bar>
      <media-play-button></media-play-button>
      <media-time-range></media-time-range>
      <media-time-display show-duration></media-time-display>
      <media-mute-button></media-mute-button>
      <media-volume-range></media-volume-range>
      <media-fullscreen-button></media-fullscreen-button>
    </media-control-bar>
  </media-controller>
</template>

<style scoped>
media-controller {
  width: 100%;
  aspect-ratio: 16 / 9;
  --media-primary-color: #4caf50;
  --media-secondary-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.player {
  width: 100%;
  height: 100%;
  background-color: #000;
}

@media (prefers-color-scheme: light) {
  media-controller {
    --media-secondary-color: #666666;
  }
}
</style>
