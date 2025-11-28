<template>
  <NuxtLayout>
    <div class="particle-system-container relative w-full h-screen overflow-hidden bg-black">
      <!-- 3D Canvas -->
      <canvas ref="canvasRef" class="absolute top-0 left-0 w-full h-full z-10"></canvas>

      <!-- Webcam Video (Hidden or Debug) -->
      <video
        ref="videoRef"
        class="absolute top-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-white/20 z-20 opacity-50 hover:opacity-100 transition-opacity"
        playsinline
      ></video>

      <!-- UI Container -->
      <div ref="uiContainerRef" class="absolute top-4 left-4 z-30"></div>

      <!-- Loading Overlay -->
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-black z-50">
        <div class="text-white text-2xl font-light tracking-widest animate-pulse">正在初始化银河系...</div>
      </div>

      <!-- Fullscreen Button -->
      <button
        @click="toggleFullscreen"
        class="absolute bottom-8 right-8 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm border border-white/10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </button>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Camera } from '@mediapipe/camera_utils'
import { Hands } from '@mediapipe/hands'
import GUI from 'lil-gui'
import * as THREE from 'three'
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Refs
const canvasRef = ref<HTMLCanvasElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const uiContainerRef = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)

// Three.js Variables
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let particles: THREE.Points
let geometry: THREE.BufferGeometry
let material: THREE.PointsMaterial
let animationId: number
let starField: THREE.Points

// Particle System State
const params = {
  count: 20000,
  size: 0.03,
  shape: 'galaxy', // Default to galaxy
  spread: 1.0,
  scale: 1.0,
  speed: 0.2,
  noiseStrength: 0.05,
  rotationX: 0,
  rotationY: 0
}

// Hand Tracking State
let handDistance = 0
let isHandDetected = false
let handX = 0.5 // Normalized 0-1
let handY = 0.5 // Normalized 0-1

// Shapes Data (Pre-calculated positions)
const shapes: Record<string, Float32Array> = {}

// Initialize System
onMounted(async () => {
  try {
    initThree()
    generateShapes()
    createParticles()
    createStarField()
    initGUI()
    await initMediaPipe()
    animate()
    isLoading.value = false
  } catch (error) {
    console.error('初始化失败：', error)
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  if (renderer) renderer.dispose()
  if (gui) gui.destroy()
  if (cameraUtils) cameraUtils.stop()
})

// Three.js Setup
function initThree() {
  if (!canvasRef.value) return

  scene = new THREE.Scene()
  // Deep space fog
  scene.fog = new THREE.FogExp2(0x000000, 0.002)

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 5

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  window.addEventListener('resize', onWindowResize)
}

function onWindowResize() {
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// Generate Particle Shapes
function generateShapes() {
  const count = params.count

  // 0. Galaxy Spiral (New Default)
  const galaxy = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const radius = Math.random() * Math.random() * 4 + 0.5 // Concentration near center
    const spinAngle = radius * 5
    const branchAngle = (i % 3) * ((Math.PI * 2) / 3) // 3 arms

    const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.3
    const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.3
    const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.3

    galaxy[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX
    galaxy[i3 + 1] = randomY * (2 - radius * 0.5) // Flattened disk
    galaxy[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ
  }
  shapes.galaxy = galaxy

  // 1. Heart Shape
  const heart = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2
    const r = Math.sqrt(Math.random())
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    const z = (Math.random() - 0.5) * 5

    heart[i * 3] = x * 0.1 * r
    heart[i * 3 + 1] = y * 0.1 * r
    heart[i * 3 + 2] = z * r
  }
  shapes.heart = heart

  // 2. Flower Shape
  const flower = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    const r = 2 + Math.sin(5 * theta) * Math.sin(5 * phi)

    flower[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    flower[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    flower[i * 3 + 2] = r * Math.cos(phi)
  }
  shapes.flower = flower

  // 3. Saturn
  const saturn = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const isRing = Math.random() > 0.4
    if (isRing) {
      const angle = Math.random() * Math.PI * 2
      const radius = 2.5 + Math.random() * 1.5
      saturn[i * 3] = Math.cos(angle) * radius
      saturn[i * 3 + 1] = (Math.random() - 0.5) * 0.1
      saturn[i * 3 + 2] = Math.sin(angle) * radius
    } else {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 1.5
      saturn[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      saturn[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      saturn[i * 3 + 2] = r * Math.cos(phi)
    }
  }
  shapes.saturn = saturn

  // 4. Buddha
  const buddha = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const part = Math.random()
    let x, y, z
    if (part < 0.2) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 0.6
      x = r * Math.sin(phi) * Math.cos(theta)
      y = r * Math.sin(phi) * Math.sin(theta) + 1.5
      z = r * Math.cos(phi)
    } else if (part < 0.6) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 1.0
      x = r * Math.sin(phi) * Math.cos(theta)
      y = r * Math.sin(phi) * Math.sin(theta)
      z = r * Math.cos(phi)
    } else {
      const theta = Math.random() * Math.PI * 2
      const r = 1.5 * Math.sqrt(Math.random())
      const h = (Math.random() - 0.5) * 0.5
      x = r * Math.cos(theta)
      y = h - 1.0
      z = r * Math.sin(theta)
    }
    buddha[i * 3] = x
    buddha[i * 3 + 1] = y
    buddha[i * 3 + 2] = z
  }
  shapes.buddha = buddha

  // 5. Fireworks
  const fireworks = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 3 * Math.cbrt(Math.random())

    fireworks[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    fireworks[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    fireworks[i * 3 + 2] = r * Math.cos(phi)
  }
  shapes.fireworks = fireworks
}

function createParticles() {
  geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(params.count * 3)
  const colors = new Float32Array(params.count * 3)

  const targetShape = shapes[params.shape]
  const color = new THREE.Color()

  for (let i = 0; i < params.count; i++) {
    const i3 = i * 3
    positions[i3] = targetShape[i3]
    positions[i3 + 1] = targetShape[i3 + 1]
    positions[i3 + 2] = targetShape[i3 + 2]

    // Star Colors: Mix of Blue, Gold, White, Red
    const r = Math.random()
    if (r > 0.9)
      color.setHex(0xffaa33) // Gold/Orange
    else if (r > 0.7)
      color.setHex(0x5599ff) // Blue-ish
    else if (r > 0.5)
      color.setHex(0xffffff) // White
    else color.setHex(0xaaaaaa) // Dim white

    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('targetPosition', new THREE.BufferAttribute(positions.slice(), 3))

  material = new THREE.PointsMaterial({
    size: params.size,
    vertexColors: true, // Enable per-particle color
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  })

  particles = new THREE.Points(geometry, material)
  scene.add(particles)
}

function createStarField() {
  const starGeo = new THREE.BufferGeometry()
  const starCount = 2000
  const starPos = new Float32Array(starCount * 3)

  for (let i = 0; i < starCount * 3; i++) {
    starPos[i] = (Math.random() - 0.5) * 50 // Large spread
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))

  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true
  })

  starField = new THREE.Points(starGeo, starMat)
  scene.add(starField)
}

// GUI Setup
let gui: GUI
function initGUI() {
  if (!uiContainerRef.value) return

  gui = new GUI({ container: uiContainerRef.value, width: 300 })
  gui.title('银河控制台')

  gui.add(params, 'shape', Object.keys(shapes)).name('宇宙形态').onChange(morphToShape)

  gui
    .add(params, 'size', 0.01, 0.2)
    .name('星体大小')
    .onChange((val: number) => {
      material.size = val
    })
  gui.add(params, 'speed', 0, 2).name('旋转速度')
  gui.add(params, 'noiseStrength', 0, 0.5).name('宇宙噪点')

  const folder = gui.addFolder('传感器数据')
  folder.add({ detected: false }, 'detected').listen().name('手部捕捉')
  folder.add({ distance: 0 }, 'distance').listen().name('手指距离')
  folder.add({ x: 0 }, 'x').listen().name('手部 X 位置')
  folder.add({ y: 0 }, 'y').listen().name('手部 Y 位置')
}

function morphToShape(shapeKey: string) {
  const targetPositions = shapes[shapeKey]
  if (!targetPositions) return

  const targetAttribute = geometry.attributes.targetPosition as THREE.BufferAttribute

  for (let i = 0; i < targetPositions.length; i++) {
    targetAttribute.array[i] = targetPositions[i]
  }
  targetAttribute.needsUpdate = true
}

// MediaPipe Setup
let cameraUtils: Camera
async function initMediaPipe() {
  if (!videoRef.value) return

  const hands = new Hands({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    }
  })

  hands.setOptions({
    maxNumHands: 1, // Focus on single hand for rotation control
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  })

  hands.onResults(onHandsResults)

  cameraUtils = new Camera(videoRef.value, {
    onFrame: async () => {
      if (videoRef.value) {
        await hands.send({ image: videoRef.value })
      }
    },
    width: 640,
    height: 480
  })

  await cameraUtils.start()
}

function onHandsResults(results: any) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    isHandDetected = true

    const landmarks = results.multiHandLandmarks[0]
    const thumbTip = landmarks[4]
    const indexTip = landmarks[8]
    const wrist = landmarks[0]

    // 1. Pinch for Scale (Zoom)
    const dist = Math.sqrt(Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2))
    handDistance = Math.max(0, Math.min(1, (dist - 0.05) * 4))

    const targetScale = 0.5 + handDistance * 2.5
    params.scale += (targetScale - params.scale) * 0.1

    // 2. Hand Position for Rotation
    // MediaPipe x is 0-1 (left-right), y is 0-1 (top-bottom)
    // We map this to rotation angles
    handX = wrist.x
    handY = wrist.y

    // Map X (0-1) to Rotation Y (-PI to PI)
    const targetRotY = (handX - 0.5) * Math.PI * 2
    // Map Y (0-1) to Rotation X (-PI/2 to PI/2)
    const targetRotX = (handY - 0.5) * Math.PI

    params.rotationY += (targetRotY - params.rotationY) * 0.1
    params.rotationX += (targetRotX - params.rotationX) * 0.1
  } else {
    isHandDetected = false
    // Slowly return to neutral scale, keep rotation drifting
    params.scale += (1.0 - params.scale) * 0.05
  }
}

// Animation Loop
const clock = new THREE.Clock()

function animate() {
  animationId = requestAnimationFrame(animate)

  const time = clock.getElapsedTime()

  // 1. Base Rotation (Auto spin)
  if (particles) {
    particles.rotation.y += params.speed * 0.002

    // 2. Hand Controlled Rotation (Additive)
    particles.rotation.x = params.rotationX
    // We add the hand Y rotation to the auto spin
    particles.rotation.y += params.rotationY * 0.05
  }

  // 3. Star Field Parallax
  if (starField) {
    starField.rotation.y -= 0.0005
  }

  // 4. Morphing & Jitter
  if (geometry && geometry.attributes.position && geometry.attributes.targetPosition) {
    const positions = geometry.attributes.position.array as Float32Array
    const targets = geometry.attributes.targetPosition.array as Float32Array

    for (let i = 0; i < params.count; i++) {
      const i3 = i * 3

      // Morph
      positions[i3] += (targets[i3] - positions[i3]) * 0.05
      positions[i3 + 1] += (targets[i3 + 1] - positions[i3 + 1]) * 0.05
      positions[i3 + 2] += (targets[i3 + 2] - positions[i3 + 2]) * 0.05

      // Twinkle / Jitter
      if (params.noiseStrength > 0) {
        positions[i3] += (Math.random() - 0.5) * params.noiseStrength * 0.05
        positions[i3 + 1] += (Math.random() - 0.5) * params.noiseStrength * 0.05
        positions[i3 + 2] += (Math.random() - 0.5) * params.noiseStrength * 0.05
      }
    }
    geometry.attributes.position.needsUpdate = true
  }

  // 5. Scale
  if (particles) {
    particles.scale.setScalar(params.scale)
  }

  renderer.render(scene, camera)
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }
}
</script>

<style scoped>
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}
</style>
