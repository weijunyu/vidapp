<script setup lang="ts">
import VideoEditor from "./components/VideoEditor.vue";
import VideoRecorder from "./components/VideoRecorder.vue";
</script>

<template>
  <div class="app-container">
    <h1>Video Tools</h1>

    <section class="video-section">
      <h2>Record Video</h2>
      <VideoRecorder />
    </section>

    <div class="divider"></div>

    <section class="video-section">
      <h2>Edit Video</h2>
      <VideoEditor />
    </section>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
}

h2 {
  color: #34495e;
  margin-bottom: 1rem;
}

.video-section {
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.video-section + .video-section {
  margin-top: 2rem;
}

.divider {
  margin: 2rem 0;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    #e0e0e0,
    #e0e0e0,
    transparent
  );
}
</style>
