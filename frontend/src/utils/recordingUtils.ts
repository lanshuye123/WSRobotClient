import type { Recording, RecordingFrame } from '@/types/recording'

export function generateRecordingId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const milliseconds = ms % 1000
  
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${Math.floor(milliseconds / 100).toString().padStart(1, '0')}`
  } else {
    return `${seconds}.${Math.floor(milliseconds / 10).toString().padStart(2, '0')}`
  }
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function compressFrames(frames: RecordingFrame[], threshold: number = 0.1): RecordingFrame[] {
  if (frames.length <= 1) return frames
  
  const firstFrame = frames[0]
  if (!firstFrame) return frames
  
  const compressed: RecordingFrame[] = [firstFrame]
  
  for (let i = 1; i < frames.length; i++) {
    const prevFrame = compressed[compressed.length - 1]
    const currentFrame = frames[i]
    
    if (!prevFrame || !currentFrame) continue
    
    let hasSignificantChange = false
    
    Object.keys(currentFrame.joints).forEach(jointId => {
      const prevAngle = prevFrame.joints[jointId] || 0
      const currentAngle = currentFrame.joints[jointId] || 0
      
      if (Math.abs(currentAngle - prevAngle) > threshold) {
        hasSignificantChange = true
      }
    })
    
    if (hasSignificantChange || (currentFrame.timestamp - prevFrame.timestamp) > 1000) {
      compressed.push(currentFrame)
    }
  }
  
  return compressed
}

export function exportRecordingToJson(recording: Recording): string {
  const exportData = {
    ...recording,
    metadata: {
      ...recording.metadata,
      exportVersion: '1.0.0',
      exportedAt: Date.now()
    }
  }
  
  return JSON.stringify(exportData, null, 2)
}

export function importRecordingFromJson(jsonData: string): Recording {
  const data = JSON.parse(jsonData)
  
  if (!data.id || !data.name || !data.robotId || !data.frames) {
    throw new Error('无效的录制数据格式')
  }
  
  const recording: Recording = {
    id: generateRecordingId(),
    name: data.name,
    robotId: data.robotId,
    createdAt: data.createdAt || Date.now(),
    duration: data.duration || 0,
    frames: data.frames,
    metadata: {
      ...data.metadata,
      importedAt: Date.now(),
      originalId: data.id
    }
  }
  
  return recording
}

export function downloadRecording(recording: Recording, filename?: string) {
  const jsonData = exportRecordingToJson(recording)
  const blob = new Blob([jsonData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = filename || `${recording.name}_${new Date(recording.createdAt).toISOString().split('T')[0]}.json`
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export function readRecordingFile(file: File): Promise<Recording> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string
        const recording = importRecordingFromJson(jsonData)
        resolve(recording)
      } catch (error) {
        reject(new Error('文件解析失败: ' + error))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsText(file)
  })
}

export function validateRecording(recording: Recording): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!recording.id) errors.push('缺少录制ID')
  if (!recording.name) errors.push('缺少录制名称')
  if (!recording.robotId) errors.push('缺少机器人ID')
  if (!Array.isArray(recording.frames)) errors.push('帧数据格式错误')
  
  if (recording.frames.length > 0) {
    recording.frames.forEach((frame, index) => {
      if (typeof frame.timestamp !== 'number') {
        errors.push(`第${index + 1}帧: 时间戳格式错误`)
      }
      if (!frame.joints || typeof frame.joints !== 'object') {
        errors.push(`第${index + 1}帧: 关节数据格式错误`)
      }
    })
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function calculateRecordingStats(recording: Recording) {
  if (recording.frames.length === 0) {
    return {
      frameCount: 0,
      duration: 0,
      averageFrameInterval: 0,
      jointCount: 0
    }
  }
  
  const frameCount = recording.frames.length
  const lastFrame = recording.frames[recording.frames.length - 1]
  const duration = recording.duration || (lastFrame ? lastFrame.timestamp : 0)
  const averageFrameInterval = duration / frameCount
  
  const jointIds = new Set<string>()
  recording.frames.forEach(frame => {
    Object.keys(frame.joints).forEach(jointId => jointIds.add(jointId))
  })
  
  return {
    frameCount,
    duration,
    averageFrameInterval,
    jointCount: jointIds.size
  }
}

export function createRecordingSnapshot(joints: Record<string, number>): RecordingFrame {
  return {
    timestamp: 0,
    joints: { ...joints }
  }
}