<template>
  <div class="joint-slider" :class="{ selected: isSelected }" @click="selectJoint">
    <div class="joint-header">
      <h4>{{ joint.id }}</h4>
      <span class="joint-type">{{ typeName }}</span>
    </div>
    
    <div class="slider-container">
      <div class="range-labels">
        <span>{{ joint.range[0] }}°</span>
        <span>{{ joint.range[1] }}°</span>
      </div>
      
      <input
        type="range"
        :min="joint.range[0]"
        :max="joint.range[1]"
        :step="1"
        :value="joint.currentAngle"
        @input="onSliderChange"
        class="slider"
      />
      
      <div class="angle-display">
        <input
          type="number"
          :min="joint.range[0]"
          :max="joint.range[1]"
          :value="joint.currentAngle"
          @change="onInputChange"
          class="angle-input"
        />
        <span>°</span>
      </div>
    </div>
    
    <div class="joint-actions">
      <button @click="resetToDefault" class="reset-btn">复位</button>
      <button v-if="joint.type === 'gripper'" @click="toggleGripper" class="toggle-btn">
        {{ joint.currentAngle > 50 ? '关闭' : '打开' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRobotStore } from '@/stores/robot'
import type { JointState } from '@/types/ws'

const props = defineProps<{
  joint: JointState
}>()

const emit = defineEmits<{
  angleChange: [jointId: string, angle: number]
}>()

const robotStore = useRobotStore()

const typeName = computed(() => {
  const names = {
    'joint': '关节',
    'flex_w': '水平旋转',
    'flex_v': '垂直旋转',
    'gripper': '夹爪'
  }
  return names[props.joint.type] || props.joint.type
})

const isSelected = computed(() => robotStore.selectedJoint === props.joint.id)

const onSliderChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const angle = parseFloat(target.value)
  emit('angleChange', props.joint.id, angle)
}

const onInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const angle = parseFloat(target.value)
  const clampedAngle = robotStore.clampAngle(angle, props.joint.range)
  emit('angleChange', props.joint.id, clampedAngle)
}

const resetToDefault = () => {
  emit('angleChange', props.joint.id, props.joint.default)
}

const toggleGripper = () => {
  const newAngle = props.joint.currentAngle > 50 ? 0 : 100
  emit('angleChange', props.joint.id, newAngle)
}

const selectJoint = () => {
  robotStore.selectJoint(props.joint.id)
}
</script>

<style scoped>
.joint-slider {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.joint-slider:hover {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.joint-slider.selected {
  border-color: #f1c40f;
  background-color: #fffde7;
}

.joint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.joint-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.joint-type {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 12px;
}

.slider-container {
  margin: 12px 0;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.angle-display {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
}

.angle-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.angle-display span {
  margin-left: 4px;
  color: #666;
}

.joint-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.reset-btn, .toggle-btn {
  flex: 1;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reset-btn {
  background: #f5f5f5;
  color: #333;
}

.reset-btn:hover {
  background: #e0e0e0;
}

.toggle-btn {
  background: #f39c12;
  color: white;
}

.toggle-btn:hover {
  background: #e67e22;
}
</style>