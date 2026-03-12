export interface RecordingFrame {
  timestamp: number
  joints: Record<string, number>
}

export interface Recording {
  id: string
  name: string
  robotId: string
  createdAt: number
  duration: number
  frames: RecordingFrame[]
  metadata?: {
    description?: string
    tags?: string[]
    version?: string
  }
}

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'playing' | 'stopped'

export interface RecordingState {
  status: RecordingStatus
  currentRecordingId: string | null
  startTime: number | null
  pauseTime: number | null
  recordedFrames: RecordingFrame[]
}

export interface PlaybackState {
  status: 'idle' | 'playing' | 'paused'
  currentRecordingId: string | null
  currentTime: number
  playbackSpeed: number
  loop: boolean
}

export interface RecordingStoreState {
  recordings: Recording[]
  recordingState: RecordingState
  playbackState: PlaybackState
  selectedRecordingId: string | null
}