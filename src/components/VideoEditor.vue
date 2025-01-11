<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import * as core from "@diffusionstudio/core";

// #region Types
interface VideoMetadata {
  size: string;
  type: string;
  duration: string;
  name: string;
  url: string;
  trimStart: number;
  trimEnd: number;
  videoDuration: number;
  width: number;
  height: number;
}
// #endregion

// #region State Management
const isDragging = ref(false);
const videoMetadata = ref<VideoMetadata | null>(null);
const videoUrl = ref<string | null>(null);
const videoPlayer = ref<HTMLVideoElement | null>(null);

// Video trim state
const videoDuration = ref(0);
const trimStart = ref(0);
const trimEnd = ref(0);
const isPlaying = ref(false);

// Export state
const exportProgress = ref<number | null>(null);
const trimStartTime = ref<number>(0);
const trimDuration = ref<string>("");

const videos = ref<VideoMetadata[]>([]);
// #endregion

// #region Utility Functions
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
// #endregion

// #region Video Loading
function loadVideoFromBlob(
  blob: Blob,
  mimeType: string,
  filename: string = `recording-${new Date().toISOString()}.${
    mimeType.split("/")[1]
  }`
) {
  const video = document.createElement("video");
  video.preload = "metadata";

  const videoObjectURL = URL.createObjectURL(blob);

  return new Promise<boolean>((resolve) => {
    video.onloadedmetadata = async () => {
      const metadata: VideoMetadata = {
        name: filename,
        size: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
        type: blob.type,
        duration: formatTime(video.duration),
        url: videoObjectURL,
        trimStart: 0,
        trimEnd: video.duration,
        videoDuration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      };

      // Add to videos array and set as current video
      videos.value.push(metadata);
      videoMetadata.value = metadata;
      videoUrl.value = metadata.url;

      // Update current trim values to match selected video
      videoDuration.value = metadata.videoDuration;
      trimStart.value = metadata.trimStart;
      trimEnd.value = metadata.trimEnd;

      resolve(true);
    };

    video.onerror = () => {
      console.error("Error loading video metadata");
      resolve(false);
    };

    video.src = videoObjectURL;
  });
}

function loadVideo(file: File) {
  if (!file.type.startsWith("video/")) {
    alert("Please select a video file");
    return false;
  }

  const videoObjectURL = URL.createObjectURL(file);

  const video = document.createElement("video");
  video.preload = "metadata";

  video.onloadedmetadata = () => {
    const metadata: VideoMetadata = {
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: file.type,
      duration: formatTime(video.duration),
      url: videoObjectURL,
      trimStart: 0,
      trimEnd: video.duration,
      videoDuration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
    };

    // Add to videos array and set as current video
    videos.value.push(metadata);
    videoMetadata.value = metadata;
    videoUrl.value = metadata.url;

    // Update current trim values to match selected video
    videoDuration.value = metadata.videoDuration;
    trimStart.value = metadata.trimStart;
    trimEnd.value = metadata.trimEnd;
  };

  video.src = videoObjectURL;
  return true;
}
// #endregion

// #region Event Handlers
function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;

  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;
  loadVideo(files[0]);
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files;

  if (!files || files.length === 0) return;
  loadVideo(files[0]);
  input.value = ""; // Reset input for allowing the same file to be selected again
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

function handleTrimChange() {
  if (!videoMetadata.value) return;

  // Update the trim values for the current video
  videoMetadata.value.trimStart = trimStart.value;
  videoMetadata.value.trimEnd = trimEnd.value;
}

function selectVideo(video: VideoMetadata) {
  videoUrl.value = video.url;
  videoMetadata.value = video;
  videoDuration.value = video.videoDuration;
  trimStart.value = video.trimStart;
  trimEnd.value = video.trimEnd;
}
// #endregion

// #region Video Playback Controls
function handleTimeUpdate() {
  if (!videoPlayer.value) return;

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
// #endregion

// #region Video Export
async function exportVideo() {
  if (videos.value.length === 0) return;

  try {
    exportProgress.value = 0;
    trimStartTime.value = Date.now();
    trimDuration.value = "";

    const composition = new core.Composition({
      // Set overall video dimensions using the first video's dimensions
      width: videos.value[0].width,
      height: videos.value[0].height,
    });
    const track = composition.createTrack("video").stacked();

    // Process each video in sequence
    for (const videoMeta of videos.value) {
      const source = await core.VideoSource.from(videoMeta.url);
      const video = new core.VideoClip(source, {
        position: "center",
        height: "100%",
        width: "100%",
      });

      // Apply trim settings for this video
      const startFrame = Math.floor(videoMeta.trimStart * 30);
      const endFrame = Math.floor(videoMeta.trimEnd * 30);
      video.offsetBy(-1 * startFrame);
      video.subclip(0, endFrame);

      // Add to track and update frame counter
      await track.add(video);
    }

    const encoder = new core.Encoder(composition);

    encoder.on("render", (event) => {
      const { progress, total } = event.detail;
      exportProgress.value = Math.round((progress * 100) / total);

      const elapsedSeconds = Math.floor(
        (Date.now() - trimStartTime.value) / 1000
      );
      trimDuration.value = formatTime(elapsedSeconds);
    });

    const suggestedName = `combined_${Date.now()}.mp4`;
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          { description: "MP4 Video", accept: { "video/mp4": [".mp4"] } },
        ],
      });
      await encoder.render(fileHandle);
    } catch {
      await encoder.render(suggestedName);
    }

    const totalSeconds = Math.floor((Date.now() - trimStartTime.value) / 1000);
    trimDuration.value = formatTime(totalSeconds);
    exportProgress.value = null;
  } catch (err) {
    console.error("Error exporting video:", err);
    alert("Failed to export video. Please try again.");
    exportProgress.value = null;
    trimDuration.value = "";
  }
}
// #endregion

// #region Cleanup
onUnmounted(() => {
  // Clean up all video URLs
  videos.value.forEach((video) => {
    URL.revokeObjectURL(video.url);
  });
});
// #endregion

defineExpose({
  loadVideoFromBlob,
});
</script>

<template>
  <div class="video-editor">
    <div
      class="dropzone"
      :class="{ dragging: isDragging }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <div class="dropzone-content">
        <i class="upload-icon">📁</i>
        <p class="dropzone-text">Drag and drop a video file here</p>
        <p class="or-divider">or</p>
        <label class="file-input-label">
          <input
            type="file"
            accept="video/*"
            class="file-input"
            @change="handleFileSelect"
          />
          Choose a video file
        </label>
      </div>
    </div>

    <div v-if="videoMetadata" class="metadata">
      <h3>Uploaded Video Details:</h3>
      <ul>
        <li>Name: {{ videoMetadata.name }}</li>
        <li>Size: {{ videoMetadata.size }}</li>
        <li>Format: {{ videoMetadata.type }}</li>
        <li>Duration: {{ videoMetadata.duration }}</li>
        <li>Width: {{ videoMetadata.width }}</li>
        <li>Height: {{ videoMetadata.height }}</li>
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
            @input="handleTrimChange"
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
            @input="handleTrimChange"
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

    <div v-if="videos.length > 0" class="videos-list">
      <h3>Uploaded Videos:</h3>
      <ul>
        <li
          v-for="(video, index) in videos"
          :key="index"
          :class="{ active: videoUrl === video.url }"
          @click="selectVideo(video)"
        >
          <div class="video-info">
            <span class="video-name">{{ video.name }}</span>
            <span class="video-duration">
              {{ formatTime(video.trimStart) }} -
              {{ formatTime(video.trimEnd) }} ({{
                formatTime(video.trimEnd - video.trimStart)
              }})
            </span>
          </div>
        </li>
      </ul>

      <button
        @click="exportVideo"
        class="control-btn trim-btn"
        :disabled="!videoUrl"
      >
        Export
      </button>
    </div>
  </div>
</template>

<style scoped>
.video-editor {
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

.dropzone-text {
  color: #666;
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

.trim-controls h3 {
  color: #333;
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

.or-divider {
  margin: 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.file-input {
  display: none;
}

.file-input-label {
  padding: 0.5rem 1rem;
  background-color: #4caf50;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.file-input-label:hover {
  background-color: #45a049;
}

.videos-list {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.videos-list ul {
  list-style: none;
  padding: 0;
}

.videos-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  margin: 0.25rem 0;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
}

.videos-list li.active {
  background-color: #e3f2fd;
}

.videos-list li:hover {
  background-color: #f5f5f5;
}

.video-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.video-name {
  font-weight: 500;
}

.video-duration {
  font-size: 0.9em;
  color: #666;
}
</style>
