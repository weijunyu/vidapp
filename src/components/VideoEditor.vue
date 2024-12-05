<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import * as core from "@diffusionstudio/core";

const isDragging = ref(false);
const videoMetadata = ref<{
  size: string;
  type: string;
  duration: string;
  name: string;
} | null>(null);
const videoUrl = ref<string | null>(null);
const videoPlayer = ref<HTMLVideoElement | null>(null);
const trimStart = ref(0);
const trimEnd = ref(0);
const videoDuration = ref(0);
const isPlaying = ref(false);
const exportProgress = ref<number | null>(null);
const trimStartTime = ref<number>(0);
const trimDuration = ref<string>("");

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function handleTimeUpdate() {
  if (!videoPlayer.value) return;

  // Stop playback if we reach trimEnd
  if (videoPlayer.value.currentTime >= trimEnd.value) {
    videoPlayer.value.pause();
    isPlaying.value = false;
  }
}

function previewTrim() {
  if (!videoPlayer.value) return;

  videoPlayer.value.currentTime = trimStart.value;
  videoPlayer.value.play();
  isPlaying.value = true;
}

function stopPreview() {
  if (!videoPlayer.value) return;

  videoPlayer.value.pause();
  isPlaying.value = false;
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;

  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  if (!file.type.startsWith("video/")) {
    alert("Please drop a video file");
    return;
  }

  // Create video element to get duration
  const video = document.createElement("video");
  video.preload = "metadata";

  video.onloadedmetadata = () => {
    videoDuration.value = video.duration;
    trimStart.value = 0;
    trimEnd.value = video.duration;

    const minutes = Math.floor(video.duration / 60);
    const seconds = Math.floor(video.duration % 60);

    videoMetadata.value = {
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: file.type,
      duration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
    };
  };

  // Create and store URL for video playback
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value);
  }
  videoUrl.value = URL.createObjectURL(file);
  video.src = videoUrl.value;
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

async function trimVideo() {
  if (!videoUrl.value) return;

  try {
    // Reset progress and start timing
    exportProgress.value = 0;
    trimStartTime.value = Date.now();
    trimDuration.value = "";

    const composition = new core.Composition();
    const source = await core.VideoSource.from(videoUrl.value);

    const startFrame = Math.floor(trimStart.value * 30);
    const endFrame = Math.floor(trimEnd.value * 30);

    const video = new core.VideoClip(source, {
      position: "center",
      height: "100%",
      width: "100%",
    }).subclip(startFrame, endFrame);

    await composition.add(video);
    const encoder = new core.Encoder(composition);

    // Add progress listener
    encoder.on("render", (event) => {
      const { progress, total } = event.detail;
      exportProgress.value = Math.round((progress * 100) / total);

      // Update duration every progress update
      const elapsedSeconds = Math.floor(
        (Date.now() - trimStartTime.value) / 1000
      );
      trimDuration.value = formatTime(elapsedSeconds);
    });

    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: `trimmed_${videoMetadata.value?.name || "video.mp4"}`,
        types: [
          {
            description: "Video File",
            accept: { "video/mp4": [".mp4"] },
          },
        ],
      });
      await encoder.render(fileHandle);
    } catch (err) {
      await encoder.render(
        `trimmed_${videoMetadata.value?.name || "video.mp4"}`
      );
    }

    // Calculate final duration
    const totalSeconds = Math.floor((Date.now() - trimStartTime.value) / 1000);
    trimDuration.value = formatTime(totalSeconds);

    // Reset progress but keep duration displayed
    exportProgress.value = null;
  } catch (err) {
    console.error("Error trimming video:", err);
    alert("Failed to trim video. Please try again.");
    exportProgress.value = null;
    trimDuration.value = "";
  }
}

// Add cleanup on component unmount
onUnmounted(() => {
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value);
  }
});
</script>

<template>
  <div class="video-dropzone">
    <div
      class="dropzone"
      :class="{ dragging: isDragging }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <div class="dropzone-content">
        <i class="upload-icon">📁</i>
        <p>Drag and drop a video file here</p>
      </div>
    </div>

    <div v-if="videoMetadata" class="metadata">
      <h3>Uploaded Video Details:</h3>
      <ul>
        <li>Name: {{ videoMetadata.name }}</li>
        <li>Size: {{ videoMetadata.size }}</li>
        <li>Format: {{ videoMetadata.type }}</li>
        <li>Duration: {{ videoMetadata.duration }}</li>
      </ul>
    </div>

    <div v-if="videoUrl" class="trim-controls">
      <h3>Trim Video</h3>
      <div class="time-controls">
        <div class="time-input">
          <label>Start Time:</label>
          <input
            type="range"
            :min="0"
            :max="videoDuration"
            :step="0.1"
            v-model.number="trimStart"
          />
          <span>{{ formatTime(trimStart) }}</span>
        </div>

        <div class="time-input">
          <label>End Time:</label>
          <input
            type="range"
            :min="0"
            :max="videoDuration"
            :step="0.1"
            v-model.number="trimEnd"
          />
          <span>{{ formatTime(trimEnd) }}</span>
        </div>
      </div>

      <div class="preview-controls">
        <button @click="previewTrim" class="control-btn" v-if="!isPlaying">
          Preview Trim
        </button>
        <button @click="stopPreview" class="control-btn" v-else>
          Stop Preview
        </button>

        <button
          @click="trimVideo"
          class="control-btn trim-btn"
          :disabled="!videoUrl"
        >
          Export Trimmed Video
        </button>

        <div
          v-if="exportProgress !== null || trimDuration"
          class="export-progress"
        >
          <div v-if="exportProgress !== null" class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${exportProgress}%` }"
            ></div>
          </div>
          <span v-if="exportProgress !== null" class="progress-text">
            {{ exportProgress }}%
          </span>
          <span v-if="trimDuration" class="duration-text">
            Time: {{ trimDuration }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="videoUrl" class="video-player">
      <video
        ref="videoPlayer"
        :src="videoUrl"
        controls
        class="player"
        @timeupdate="handleTimeUpdate"
      ></video>
    </div>
  </div>
</template>

<style scoped>
.video-dropzone {
  width: 100%;
  max-width: 640px;
  margin: 1rem 0;
}

.dropzone {
  border: 2px dashed #ccc;
  border-radius: 4px;
  padding: 2rem;
  text-align: center;
  background-color: #f8f8f8;
  transition: all 0.3s ease;
  cursor: pointer;
}

.dropzone.dragging {
  border-color: #4caf50;
  background-color: #e8f5e9;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  font-size: 2rem;
}

.metadata {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.metadata h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.metadata ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.metadata li {
  margin: 0.25rem 0;
  color: #666;
}

.video-player {
  margin-top: 1rem;
  width: 100%;
}

.player {
  width: 100%;
  border-radius: 4px;
  background-color: #000;
}

.trim-controls {
  width: 100%;
  max-width: 640px;
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.time-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0;
}

.time-input {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.time-input label {
  min-width: 80px;
  color: #666;
}

.time-input input[type="range"] {
  flex: 1;
}

.time-input span {
  min-width: 50px;
  color: #666;
}

.preview-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.control-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #4caf50;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.control-btn:hover {
  background-color: #45a049;
}

.trim-btn {
  background-color: #2196f3;
}

.trim-btn:hover:not(:disabled) {
  background-color: #1976d2;
}

.export-progress {
  margin-top: 1rem;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #2196f3;
  transition: width 0.3s ease;
}

.progress-text {
  min-width: 4rem;
  color: #666;
  font-size: 0.9rem;
}

.duration-text {
  min-width: 6rem;
  color: #666;
  font-size: 0.9rem;
}
</style>
