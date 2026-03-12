import { defineStore } from 'pinia'
import type { Recording, RecordingState, PlaybackState, RecordingStoreState, RecordingStatus } from '@/types/recording'
import { generateRecordingId, formatDuration, exportRecordingToJson, importRecordingFromJson } from '@/utils/recordingUtils'

const STORAGE_KEY = 'robot_recordings'

export const useRecordingStore = defineStore('recording', {
  state: (): RecordingStoreState => ({
    recordings: [],
    recordingState: {
      status: 'idle',
      currentRecordingId: null,
      startTime: null,
      pauseTime: null,
      recordedFrames: []
    },
    playbackState: {
      status: 'idle',
      currentRecordingId: null,
      currentTime: 0,
      playbackSpeed: 1.0,
      loop: false
    },
    selectedRecordingId: null
  }),

  getters: {
    isRecording: (state) => state.recordingState.status === 'recording',
    isPaused: (state) => state.recordingState.status === 'paused',
    isPlaying: (state) => state.playbackState.status === 'playing',
    currentRecording: (state) => {
      if (!state.recordingState.currentRecordingId) return null
      return state.recordings.find(r => r.id === state.recordingState.currentRecordingId) || null
    },
    selectedRecording: (state) => {
      if (!state.selectedRecordingId) return null
      return state.recordings.find(r => r.id === state.selectedRecordingId) || null
    },
    recordingDuration: (state) => {
      if (state.recordingState.recordedFrames.length === 0) return 0
      const lastFrame = state.recordingState.recordedFrames[state.recordingState.recordedFrames.length - 1]
      return lastFrame?.timestamp || 0
    },
    hasRecordings: (state) => state.recordings.length > 0
  },

  actions: {
    loadRecordings() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const data = JSON.parse(stored)
          this.recordings = data.recordings || []
        }
      } catch (error) {
        console.error('加载录制数据失败:', error)
        this.recordings = []
      }
    },

    saveRecordings() {
      try {
        const data = {
          recordings: this.recordings,
          version: '1.0.0',
          savedAt: Date.now()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error('保存录制数据失败:', error)
      }
    },

    createRecording(name: string, robotId: string) {
      const recording: Recording = {
        id: generateRecordingId(),
        name,
        robotId,
        createdAt: Date.now(),
        duration: 0,
        frames: [],
        metadata: {
          description: '',
          tags: [],
          version: '1.0.0'
        }
      }
      
      this.recordings.push(recording)
      this.selectedRecordingId = recording.id
      this.saveRecordings()
      
      return recording
    },

    updateRecording(recordingId: string, updates: Partial<Omit<Recording, 'id'>>) {
      const index = this.recordings.findIndex(r => r.id === recordingId)
      if (index !== -1) {
        // 确保不会覆盖id字段
        const { id, ...safeUpdates } = updates as any
        this.recordings[index] = { ...this.recordings[index], ...safeUpdates }
        this.saveRecordings()
      }
    },

    deleteRecording(recordingId: string) {
      const index = this.recordings.findIndex(r => r.id === recordingId)
      if (index !== -1) {
        this.recordings.splice(index, 1)
        
        if (this.selectedRecordingId === recordingId) {
          this.selectedRecordingId = null
        }
        
        if (this.recordingState.currentRecordingId === recordingId) {
          this.stopRecording()
        }
        
        if (this.playbackState.currentRecordingId === recordingId) {
          this.stopPlayback()
        }
        
        this.saveRecordings()
      }
    },

    selectRecording(recordingId: string | null) {
      this.selectedRecordingId = recordingId
    },

    startRecording(robotId: string) {
      if (this.isRecording) return
      
      const name = `录制_${new Date().toLocaleTimeString()}`
      const recording = this.createRecording(name, robotId)
      
      this.recordingState = {
        status: 'recording',
        currentRecordingId: recording.id,
        startTime: Date.now(),
        pauseTime: null,
        recordedFrames: []
      }
    },

    pauseRecording() {
      if (this.recordingState.status !== 'recording') return
      
      this.recordingState.status = 'paused'
      this.recordingState.pauseTime = Date.now()
    },

    resumeRecording() {
      if (this.recordingState.status !== 'paused') return
      
      const pauseDuration = Date.now() - (this.recordingState.pauseTime || Date.now())
      this.recordingState.status = 'recording'
      this.recordingState.pauseTime = null
      
      this.recordingState.recordedFrames = this.recordingState.recordedFrames.map(frame => ({
        ...frame,
        timestamp: frame.timestamp + pauseDuration
      }))
    },

    stopRecording() {
      if (this.recordingState.status === 'idle') return
      
      const recording = this.currentRecording
      if (recording) {
        recording.duration = this.recordingDuration
        recording.frames = [...this.recordingState.recordedFrames]
        this.saveRecordings()
      }
      
      this.recordingState = {
        status: 'idle',
        currentRecordingId: null,
        startTime: null,
        pauseTime: null,
        recordedFrames: []
      }
    },

    addRecordingFrame(joints: Record<string, number>) {
      if (this.recordingState.status !== 'recording') return
      
      const startTime = this.recordingState.startTime || Date.now()
      const timestamp = Date.now() - startTime
      
      this.recordingState.recordedFrames.push({
        timestamp,
        joints: { ...joints }
      })
    },

    startPlayback(recordingId: string) {
      const recording = this.recordings.find(r => r.id === recordingId)
      if (!recording) return
      
      this.playbackState = {
        status: 'playing',
        currentRecordingId: recordingId,
        currentTime: 0,
        playbackSpeed: 1.0,
        loop: false
      }
    },

    pausePlayback() {
      if (this.playbackState.status !== 'playing') return
      this.playbackState.status = 'paused'
    },

    resumePlayback() {
      if (this.playbackState.status !== 'paused') return
      this.playbackState.status = 'playing'
    },

    stopPlayback() {
      this.playbackState = {
        status: 'idle',
        currentRecordingId: null,
        currentTime: 0,
        playbackSpeed: 1.0,
        loop: false
      }
    },

    setPlaybackTime(time: number) {
      const recording = this.recordings.find(r => r.id === this.playbackState.currentRecordingId)
      if (!recording) return
      
      this.playbackState.currentTime = Math.max(0, Math.min(time, recording.duration))
    },

    setPlaybackSpeed(speed: number) {
      this.playbackState.playbackSpeed = Math.max(0.1, Math.min(speed, 10.0))
    },

    toggleLoop() {
      this.playbackState.loop = !this.playbackState.loop
    },

    getCurrentPlaybackFrame() {
      const recording = this.recordings.find(r => r.id === this.playbackState.currentRecordingId)
      if (!recording || recording.frames.length === 0) return null
      
      const currentTime = this.playbackState.currentTime
      
      if (currentTime <= 0) return recording.frames[0]
      if (currentTime >= recording.duration) return recording.frames[recording.frames.length - 1]
      
      for (let i = 0; i < recording.frames.length - 1; i++) {
        const frame1 = recording.frames[i]
        const frame2 = recording.frames[i + 1]
        
        if (!frame1 || !frame2) continue
        
        if (currentTime >= frame1.timestamp && currentTime <= frame2.timestamp) {
          const ratio = (currentTime - frame1.timestamp) / (frame2.timestamp - frame1.timestamp)
          
          const interpolatedJoints: Record<string, number> = {}
          Object.keys(frame1.joints).forEach(jointId => {
            const angle1 = frame1.joints[jointId] || 0
            const angle2 = frame2.joints[jointId] || 0
            interpolatedJoints[jointId] = angle1 + (angle2 - angle1) * ratio
          })
          
          return {
            timestamp: currentTime,
            joints: interpolatedJoints
          }
        }
      }
      
      return recording.frames[recording.frames.length - 1]
    },

    exportRecording(recordingId: string) {
      const recording = this.recordings.find(r => r.id === recordingId)
      if (!recording) return null
      
      return exportRecordingToJson(recording)
    },

    importRecording(jsonData: string) {
      try {
        const recording = importRecordingFromJson(jsonData)
        this.recordings.push(recording)
        this.saveRecordings()
        return recording
      } catch (error) {
        console.error('导入录制失败:', error)
        throw error
      }
    },

    clearAllRecordings() {
      this.recordings = []
      this.selectedRecordingId = null
      this.stopRecording()
      this.stopPlayback()
      localStorage.removeItem(STORAGE_KEY)
    }
  }
})