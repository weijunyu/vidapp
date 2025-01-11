<script setup lang="ts">
import VideoEditor from "./components/VideoEditor.vue";
import VideoRecorder from "./components/VideoRecorder.vue";
import { ref } from "vue";

const videoEditorRef = ref<InstanceType<typeof VideoEditor> | null>(null);

async function handleRecordingComplete(payload: {
  blob: Blob;
  mimeType: string;
}) {
  if (videoEditorRef.value) {
    const success = await videoEditorRef.value.loadVideoFromBlob(
      payload.blob,
      payload.mimeType
    );
    if (!success) {
      console.error("Failed to load video into editor");
    }
  }
}
</script>

<template>
  <div class="app-container">
    <h1>Video Tools</h1>

    <section class="video-section">
      <h2>Record Video</h2>
      <VideoRecorder @recording-complete="handleRecordingComplete" />
    </section>

    <div class="divider"></div>

    <section class="video-section">
      <h2>Edit Video</h2>
      <VideoEditor ref="videoEditorRef" />
    </section>
  </div>
</template>

<style>
:root {
  color-scheme: dark light;
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: #1a1a1a;
    color: #e0e0e0;
  }
}

@media (prefers-color-scheme: light) {
  body {
    background-color: #f5f5f5;
    color: #333333;
  }
}
</style>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

h2 {
  margin-bottom: 1rem;
}

.video-section {
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.video-section + .video-section {
  margin-top: 2rem;
}

.divider {
  margin: 2rem 0;
  height: 1px;
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  h1 {
    color: #e0e0e0;
  }

  h2 {
    color: #90a4ae;
  }

  .video-section {
    background-color: #2d2d2d;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .divider {
    background: linear-gradient(
      to right,
      transparent,
      #404040,
      #404040,
      transparent
    );
  }
}

/* Light mode styles */
@media (prefers-color-scheme: light) {
  h1 {
    color: #1a1a1a;
  }

  h2 {
    color: #2c3e50;
  }

  .video-section {
    background-color: #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .divider {
    background: linear-gradient(
      to right,
      transparent,
      #d1d1d1,
      #d1d1d1,
      transparent
    );
  }
}
</style>
