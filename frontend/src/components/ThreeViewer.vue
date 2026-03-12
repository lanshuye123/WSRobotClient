<template>
  <div ref="container" class="three-viewer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { useRobotStore } from '@/stores/robot'

const container = ref<HTMLDivElement>()
const robotStore = useRobotStore()

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationFrameId: number

const jointObjects = new Map<string, THREE.Object3D>()
const gripperObjects = new Map<string, THREE.Object3D[]>()

const initThree = () => {
  if (!container.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)

  camera = new THREE.PerspectiveCamera(
    75,
    container.value.clientWidth / container.value.clientHeight,
    0.1,
    1000
  )
  camera.position.set(5, 5, 5)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  addLights()
  addGrid()
  addAxes()

  animate()
}

const addLights = () => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  directionalLight.castShadow = true
  scene.add(directionalLight)
}

const addGrid = () => {
  const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444)
  scene.add(gridHelper)
}

const addAxes = () => {
  const axesHelper = new THREE.AxesHelper(5)
  scene.add(axesHelper)
}

const createJointGeometry = (type: string) => {
  switch (type) {
    case 'flex_w':
      return new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16)
    case 'flex_v':
      return new THREE.BoxGeometry(0.6, 0.6, 0.6)
    case 'gripper':
      return new THREE.BoxGeometry(0.3, 0.6, 0.3)
    default:
      return new THREE.CylinderGeometry(0.3, 0.3, 1, 8)
  }
}

const createJointMaterial = (type: string, isSelected: boolean = false) => {
  let color = 0x3498db
  
  switch (type) {
    case 'flex_w':
      color = 0xe74c3c
      break
    case 'flex_v':
      color = 0x2ecc71
      break
    case 'gripper':
      color = 0xf39c12
      break
  }

  if (isSelected) {
    color = 0xf1c40f
  }

  return new THREE.MeshPhongMaterial({ 
    color,
    shininess: 30
  })
}

const buildRobot = () => {
  // 确保在构建前完全清理
  clearRobotFromScene()
  
  if (robotStore.jointList.length === 0) {
    console.warn('尝试构建机器人但关节列表为空')
    return
  }
  
  const jointMap = new Map(robotStore.jointList.map((j: any) => [j.id, j]))
  const rootJoints = robotStore.jointList.filter((j: any) => !robotStore.jointList.some((other: any) => other.next === j.id))

  if (rootJoints.length === 0) {
    console.warn('未找到根关节，无法构建机器人')
    return
  }

  rootJoints.forEach(joint => {
    buildJointChain(joint, jointMap, new THREE.Vector3(0, 0, 0))
  })
  
  console.log(`机器人构建完成，关节数: ${robotStore.jointList.length}`)
}

const buildJointChain = (joint: any, jointMap: Map<string, any>, position: THREE.Vector3, parent?: THREE.Object3D) => {
  const geometry = createJointGeometry(joint.type)
  const material = createJointMaterial(joint.type, joint.id === robotStore.selectedJoint)
  const mesh = new THREE.Mesh(geometry, material)
  
  mesh.position.copy(position)
  mesh.castShadow = true
  
  if (parent) {
    parent.add(mesh)
  } else {
    scene.add(mesh)
  }
  
  jointObjects.set(joint.id, mesh)

  if (joint.type === 'gripper') {
    createGripper(mesh, joint)
  }

  if (joint.next) {
    const nextJoint = jointMap.get(joint.next)
    if (nextJoint) {
      const nextPosition = new THREE.Vector3(0, 1.2, 0)
      buildJointChain(nextJoint, jointMap, nextPosition, mesh)
    }
  }
}

const createGripper = (parent: THREE.Object3D, joint: any) => {
  const leftGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.3)
  const rightGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.3)
  const material = createJointMaterial('gripper')
  
  const leftGripper = new THREE.Mesh(leftGeometry, material)
  const rightGripper = new THREE.Mesh(rightGeometry, material)
  
  leftGripper.position.set(-0.2, 0.5, 0)
  rightGripper.position.set(0.2, 0.5, 0)
  
  leftGripper.castShadow = true
  rightGripper.castShadow = true
  
  parent.add(leftGripper)
  parent.add(rightGripper)
  
  gripperObjects.set(joint.id, [leftGripper, rightGripper])
}

const updateRobot = () => {
  robotStore.jointList.forEach((joint: any) => {
    const jointObj = jointObjects.get(joint.id)
    if (jointObj) {
      switch (joint.type) {
        case 'flex_w':
          jointObj.rotation.y = THREE.MathUtils.degToRad(joint.currentAngle)
          break
        case 'flex_v':
          jointObj.rotation.x = THREE.MathUtils.degToRad(joint.currentAngle)
          break
        case 'gripper':
          updateGripper(joint.id, joint.currentAngle)
          break
        default:
          jointObj.rotation.z = THREE.MathUtils.degToRad(joint.currentAngle)
      }
    }
  })
}

const updateGripper = (jointId: string, angle: number) => {
  const grippers = gripperObjects.get(jointId)
  if (grippers && grippers.length >= 2) {
    const left = grippers[0] as THREE.Mesh
    const right = grippers[1] as THREE.Mesh
    const openAmount = angle / 100 * 0.3
    
    left.position.x = -0.2 - openAmount
    right.position.x = 0.2 + openAmount
  }
}

// 清理场景中的机器人模型
const clearRobotFromScene = () => {
  // 递归清理Three.js对象及其资源
  const cleanupObject = (obj: THREE.Object3D) => {
    // 递归清理所有子对象
    while (obj.children.length > 0) {
      const child = obj.children[0]
      if (child) {
        cleanupObject(child)
        obj.remove(child)
      } else {
        // 如果child是undefined，直接移除
        obj.children.shift()
      }
    }
    
    // 从父对象中移除
    if (obj.parent) {
      obj.parent.remove(obj)
    } else if (scene) {
      scene.remove(obj)
    }
    
    // 清理几何体和材质（释放GPU内存）
    if (obj instanceof THREE.Mesh) {
      if (obj.geometry) {
        obj.geometry.dispose()
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(material => material.dispose())
        } else {
          obj.material.dispose()
        }
      }
    }
  }
  
  // 清理所有关节对象
  jointObjects.forEach(obj => {
    cleanupObject(obj)
  })
  
  // 清理夹爪对象
  gripperObjects.forEach(grippers => {
    grippers.forEach(gripper => {
      cleanupObject(gripper)
    })
  })
  
  // 清空Map
  jointObjects.clear()
  gripperObjects.clear()
}

const animate = () => {
  animationFrameId = requestAnimationFrame(animate)
  
  if (controls) {
    controls.update()
  }
  
  updateRobot()
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

const onResize = () => {
  if (!container.value || !camera || !renderer) return
  
  camera.aspect = container.value.clientWidth / container.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
}

onMounted(() => {
  initThree()
  window.addEventListener('resize', onResize)
  
  // 添加构建状态锁，防止重复构建
  let isBuilding = false
  
  // 单一监听器处理机器人状态变化
  watch(() => ({
    robotId: robotStore.robotId,
    jointCount: robotStore.jointList.length
  }), ({ robotId, jointCount }, oldValues) => {
    const oldRobotId = oldValues?.robotId
    const oldJointCount = oldValues?.jointCount || 0
    
    // 机器人被清除（断开连接）
    if (oldRobotId && !robotId) {
      clearRobotFromScene()
      isBuilding = false
      return
    }
    
    // 新机器人连接
    if (robotId && !oldRobotId && jointCount > 0) {
      if (!isBuilding) {
        isBuilding = true
        buildRobot()
        // 构建完成后重置状态锁
        setTimeout(() => {
          isBuilding = false
        }, 100)
      }
      return
    }
    
    // 关节数量变化（重新连接或配置更新）
    if (robotId && oldRobotId === robotId) {
      if (jointCount > 0 && oldJointCount === 0) {
        // 从无关节到有关节（重新连接）
        if (!isBuilding) {
          isBuilding = true
          clearRobotFromScene()
          buildRobot()
          setTimeout(() => {
            isBuilding = false
          }, 100)
        }
      } else if (jointCount === 0 && oldJointCount > 0) {
        // 从有关节到无关节（连接丢失但robotId还在）
        clearRobotFromScene()
        isBuilding = false
      }
    }
  }, { deep: true })
  
  watch(() => robotStore.selectedJoint, () => {
    robotStore.jointList.forEach((joint: any) => {
      const jointObj = jointObjects.get(joint.id)
      if (jointObj && jointObj instanceof THREE.Mesh) {
        jointObj.material = createJointMaterial(joint.type, joint.id === robotStore.selectedJoint)
      }
    })
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.three-viewer {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>