<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps<{
  personalityCode: string
  isHidden: boolean
}>()

const containerRef = ref<HTMLDivElement>()
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let animationId: number = 0
let meshes: THREE.Mesh[] = []
let particles: THREE.Points | null = null

function initScene() {
  if (!containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight || 300

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  // Camera
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
  camera.position.z = 5

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  containerRef.value.appendChild(renderer.domElement)

  // Lights
  const ambientLight = new THREE.AmbientLight(0x404040, 1.5)
  scene.add(ambientLight)

  const pointLight = new THREE.PointLight(0xffffff, 2, 100)
  pointLight.position.set(5, 5, 5)
  scene.add(pointLight)

  const pointLight2 = new THREE.PointLight(0xff6b9d, 1.5, 100)
  pointLight2.position.set(-5, -5, 5)
  scene.add(pointLight2)

  // Create content based on personality
  createContent()

  // Animation loop
  animate()
}

function createContent() {
  if (!scene) return

  // Clear existing
  meshes.forEach(m => scene!.remove(m))
  meshes = []
  if (particles) {
    scene.remove(particles)
    particles = null
  }

  if (props.isHidden) {
    createHiddenEffect()
  } else {
    createStandardEffect()
  }
}

function createStandardEffect() {
  if (!scene) return

  // Map personality codes to geometry types
  const geometryMap: Record<string, THREE.BufferGeometry> = {
    BOSS: new THREE.BoxGeometry(1.2, 1.2, 1.2),
    MILKTEA: new THREE.SphereGeometry(0.8, 32, 32),
    FIREWORK: new THREE.IcosahedronGeometry(0.9, 1),
    TROUBLE: new THREE.OctahedronGeometry(0.9),
    ATHLETE: new THREE.ConeGeometry(0.6, 1.5, 8),
    IDOL: new THREE.TorusGeometry(0.7, 0.3, 16, 32),
    GENERAL: new THREE.DodecahedronGeometry(0.9),
    ANCHOR: new THREE.CylinderGeometry(0.5, 0.7, 1.2, 8),
    ARCHIVER: new THREE.BoxGeometry(1, 1.4, 0.6),
    ANGEL: new THREE.SphereGeometry(0.7, 32, 32),
    POET: new THREE.TetrahedronGeometry(1),
    HACKER: new THREE.TorusKnotGeometry(0.5, 0.2, 64, 8),
    NINJA: new THREE.ConeGeometry(0.5, 1.2, 4),
    ARTIST: new THREE.IcosahedronGeometry(0.8, 0),
    STRATEGIST: new THREE.OctahedronGeometry(1),
    PROPHET: new THREE.SphereGeometry(0.6, 32, 32),
    BUTTERFLY: new THREE.SphereGeometry(0.7, 32, 32),
    FIRECRACKER: new THREE.IcosahedronGeometry(0.8, 1),
    BAMBOO: new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8),
    NEBULA: new THREE.TorusGeometry(0.6, 0.2, 16, 32),
  }

  const geometry = geometryMap[props.personalityCode] || new THREE.SphereGeometry(0.8, 32, 32)

  // Material with personality color
  const colorMap: Record<string, number> = {
    BOSS: 0x4a90e2, MILKTEA: 0xf5a623, FIREWORK: 0xff6b9d,
    TROUBLE: 0x7ed321, ATHLETE: 0xd0021b, IDOL: 0xbd10e0,
    GENERAL: 0x9013fe, ANCHOR: 0x50e3c2, ARCHIVER: 0xb8e986,
    ANGEL: 0xffd93d, POET: 0x6a5acd, HACKER: 0x00ced1,
    NINJA: 0x2c3e50, ARTIST: 0xe74c3c, STRATEGIST: 0x3498db,
    PROPHET: 0x9b59b6, BUTTERFLY: 0xff69b4, FIRECRACKER: 0xff4500,
    BAMBOO: 0x228b22, NEBULA: 0x4169e1,
  }

  const material = new THREE.MeshStandardMaterial({
    color: colorMap[props.personalityCode] || 0x888888,
    metalness: 0.3,
    roughness: 0.4,
    emissive: colorMap[props.personalityCode] || 0x888888,
    emissiveIntensity: 0.2,
  })

  const mesh = new THREE.Mesh(geometry, material)
  scene!.add(mesh)
  meshes.push(mesh)

  // Floating particles
  const particleCount = 50
  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6
  }

  const particleGeo = new THREE.BufferGeometry()
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particleMat = new THREE.PointsMaterial({
    color: colorMap[props.personalityCode] || 0xffffff,
    size: 0.05,
    transparent: true,
    opacity: 0.6,
  })

  particles = new THREE.Points(particleGeo, particleMat)
  scene!.add(particles)
}

function createHiddenEffect() {
  if (!scene) return

  // Golden material for hidden types
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0xffa500,
    emissiveIntensity: 0.5,
  })

  // Complex geometry for hidden types
  const geometries = [
    new THREE.IcosahedronGeometry(0.6, 2),
    new THREE.OctahedronGeometry(0.5),
    new THREE.TetrahedronGeometry(0.4),
  ]

  geometries.forEach((geo, i) => {
    const mesh = new THREE.Mesh(geo, goldMaterial)
    mesh.position.set(
      Math.cos(i * 2.1) * 1.5,
      Math.sin(i * 2.1) * 1.5,
      0
    )
    scene!.add(mesh)
    meshes.push(mesh)
  })

  // Particle burst effect
  const particleCount = 200
  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    const r = 2 + Math.random() * 2
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }

  const particleGeo = new THREE.BufferGeometry()
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particleMat = new THREE.PointsMaterial({
    color: 0xffd700,
    size: 0.08,
    transparent: true,
    opacity: 0.8,
  })

  particles = new THREE.Points(particleGeo, particleMat)
  scene!.add(particles)

  // Ring halo
  const ringGeo = new THREE.TorusGeometry(2, 0.02, 16, 100)
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.3,
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = Math.PI / 2
  scene!.add(ring)
  meshes.push(ring)
}

function animate() {
  animationId = requestAnimationFrame(animate)

  const time = Date.now() * 0.001

  // Rotate main meshes
  meshes.forEach((mesh, i) => {
    mesh.rotation.x += 0.005 * (i + 1)
    mesh.rotation.y += 0.008 * (i + 1)
    mesh.position.y = Math.sin(time + i) * 0.2
  })

  // Rotate particles
  if (particles) {
    particles.rotation.y += 0.002
    particles.rotation.x += 0.001
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

function handleResize() {
  if (!containerRef.value || !renderer || !camera) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight || 300
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

onMounted(() => {
  initScene()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
  if (renderer) {
    renderer.dispose()
    if (containerRef.value && renderer.domElement.parentNode === containerRef.value) {
      containerRef.value.removeChild(renderer.domElement)
    }
  }
  meshes = []
  particles = null
})

watch(() => props.personalityCode, () => {
  createContent()
})
</script>

<template>
  <div ref="containerRef" class="three-container"></div>
</template>

<style scoped>
.three-container {
  width: 100%;
  height: 300px;
  border-radius: 16px;
  overflow: hidden;
}
</style>
