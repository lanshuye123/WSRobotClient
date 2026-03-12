import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    recordingPanelExpanded: false,
    playbackPanelExpanded: false,
    panelAnimationDuration: 300 // 毫秒
  }),

  getters: {
    isRecordingPanelVisible: (state) => state.recordingPanelExpanded,
    isPlaybackPanelVisible: (state) => state.playbackPanelExpanded,
    recordingPanelWidth: (state) => state.recordingPanelExpanded ? 320 : 0,
    playbackPanelHeight: (state) => state.playbackPanelExpanded ? 180 : 0
  },

  actions: {
    toggleRecordingPanel() {
      this.recordingPanelExpanded = !this.recordingPanelExpanded
    },

    togglePlaybackPanel() {
      this.playbackPanelExpanded = !this.playbackPanelExpanded
    },

    showRecordingPanel() {
      this.recordingPanelExpanded = true
    },

    hideRecordingPanel() {
      this.recordingPanelExpanded = false
    },

    showPlaybackPanel() {
      this.playbackPanelExpanded = true
    },

    hidePlaybackPanel() {
      this.playbackPanelExpanded = false
    },

    setRecordingPanel(expanded: boolean) {
      this.recordingPanelExpanded = expanded
    },

    setPlaybackPanel(expanded: boolean) {
      this.playbackPanelExpanded = expanded
    }
  }
})