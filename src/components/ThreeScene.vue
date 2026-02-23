<template>
  <canvas ref="canvasRef" class="webgl-canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { useTheme } from '../composables/useTheme'

const props = defineProps({
  modelUrl: { type: String, default: '/mx_compressed.glb' },
  animated: { type: Boolean, default: false },
  modelScale: { type: Number, default: 1 },
  modelPosX: { type: Number, default: 0 },
  modelPosY: { type: Number, default: 0 },
  modelZoom: { type: Number, default: 0 },
  models: { type: Array, default: () => [] }
})
const emit = defineEmits(['progress', 'loaded'])
const canvasRef = ref(null)
const { isDark } = useTheme()
let animId = null

// Theme color configs
const DARK = {
  clear: 0x0b0b0f, fog: 0x0b0b0f, fogDensity: 0.04,
  ambient: 0.3, keyIntensity: 1.8, hemiSky: 0x1a1a2e, hemiGround: 0x0b0b0f, hemiIntensity: 0.3,
  starOpacity: 0.85,
  gridColor1: 0x222233, gridColor2: 0x161622, gridOpacity: 0.4,
  planetColors: [0x1a2a3a, 0x2c4a3a, 0x1a1a30],
  glowOpacity: 0.06
}
const LIGHT = {
  clear: 0xe8e4dd, fog: 0xe8e4dd, fogDensity: 0.025,
  ambient: 0.8, keyIntensity: 2.2, hemiSky: 0xddeeff, hemiGround: 0xe8e4dd, hemiIntensity: 0.6,
  starOpacity: 0.15,
  gridColor1: 0xc0b8a8, gridColor2: 0xd5cfc2, gridOpacity: 0.25,
  planetColors: [0xc8d8e8, 0xb8d0c0, 0xc0c0d8],
  glowOpacity: 0.1
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 100)

  // Lighting (will be updated by theme)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)
  const keyLight = new THREE.DirectionalLight(0xfff0dd, 1.8)
  keyLight.position.set(4, 6, 5)
  scene.add(keyLight)
  const fillLight = new THREE.DirectionalLight(0xaaccff, 0.4)
  fillLight.position.set(-4, 3, -3)
  scene.add(fillLight)
  const rimLight = new THREE.DirectionalLight(0xffeedd, 0.6)
  rimLight.position.set(0, 2, -5)
  scene.add(rimLight)
  const bottomLight = new THREE.PointLight(0xc9a96e, 0.5, 8)
  bottomLight.position.set(0, -0.5, 2)
  scene.add(bottomLight)
  const hemiLight = new THREE.HemisphereLight(0x1a1a2e, 0x0b0b0f, 0.3)
  scene.add(hemiLight)

  // Starfield / particles
  const starCount = 3000
  const starGeo = new THREE.BufferGeometry()
  const starPos = new Float32Array(starCount * 3)
  const starCol = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3
    const r = 15 + Math.random() * 35
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    starPos[i3] = r * Math.sin(phi) * Math.cos(theta)
    starPos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    starPos[i3 + 2] = r * Math.cos(phi)
    const c = Math.random()
    if (c < 0.6) { starCol[i3] = 0.95; starCol[i3+1] = 0.95; starCol[i3+2] = 1 }
    else if (c < 0.85) { starCol[i3] = 0.7; starCol[i3+1] = 0.8; starCol[i3+2] = 1 }
    else { starCol[i3] = 1; starCol[i3+1] = 0.9; starCol[i3+2] = 0.6 }
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3))
  const starMat = new THREE.PointsMaterial({ size: 0.08, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false })
  const stars = new THREE.Points(starGeo, starMat)
  scene.add(stars)

  // Planets
  const planetMeshes = []
  const planetData = [
    { radius: 1.5, pos: [5,7,-18], ring: { inner:1.9, outer:2.7, opacity:0.25, tiltX:0.35, tiltZ:0.1 } },
    { radius: 0.5, pos: [10,2,-14] },
    { radius: 2.0, pos: [12,-2,-25], ring: { inner:2.6, outer:3.6, opacity:0.18, tiltX:0.3, tiltZ:-0.1 } }
  ]
  planetData.forEach((p, idx) => {
    const mat = new THREE.MeshStandardMaterial({ color: DARK.planetColors[idx], roughness: 0.8, metalness: 0.1 })
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.radius, 32, 32), mat)
    mesh.position.set(...p.pos)
    scene.add(mesh)
    planetMeshes.push(mat)
    if (p.ring) {
      const rMat = new THREE.MeshBasicMaterial({ color: 0x4a3a5c, side: THREE.DoubleSide, transparent: true, opacity: p.ring.opacity })
      const rMesh = new THREE.Mesh(new THREE.RingGeometry(p.ring.inner, p.ring.outer, 64), rMat)
      rMesh.position.set(...p.pos)
      rMesh.rotation.x = Math.PI * p.ring.tiltX
      rMesh.rotation.z = Math.PI * p.ring.tiltZ
      scene.add(rMesh)
    }
  })

  // Grid floor
  const FLOOR_Y = -0.75
  const gridGroup = new THREE.Group()
  const grid = new THREE.GridHelper(20, 30, 0x222233, 0x161622)
  grid.material.opacity = 0.4; grid.material.transparent = true
  gridGroup.add(grid)
  const subGrid = new THREE.GridHelper(20, 90, 0x1a1a28, 0x1a1a28)
  subGrid.material.opacity = 0.12; subGrid.material.transparent = true; subGrid.position.y = 0.001
  gridGroup.add(subGrid)
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1.5, 64), new THREE.MeshBasicMaterial({ color: 0xc9a96e, transparent: true, opacity: 0.06 }))
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.005
  gridGroup.add(glow)
  gridGroup.position.y = FLOOR_Y
  scene.add(gridGroup)

  // Theme apply function
  function applySceneTheme(dark) {
    const t = dark ? DARK : LIGHT
    renderer.setClearColor(t.clear, 1)
    renderer.toneMappingExposure = dark ? 0.9 : 1.2
    scene.fog = new THREE.FogExp2(t.fog, t.fogDensity)
    ambientLight.intensity = t.ambient
    keyLight.intensity = t.keyIntensity
    hemiLight.color.setHex(t.hemiSky)
    hemiLight.groundColor.setHex(t.hemiGround)
    hemiLight.intensity = t.hemiIntensity
    starMat.opacity = t.starOpacity
    grid.material.color.setHex(t.gridColor1)
    grid.material.opacity = t.gridOpacity
    subGrid.material.color.setHex(t.gridColor2)
    glow.material.opacity = t.glowOpacity
    planetMeshes.forEach((mat, i) => mat.color.setHex(t.planetColors[i]))
  }

  // Apply initial theme
  applySceneTheme(isDark.value)

  // Watch for theme changes
  const stopWatch = watch(isDark, (dark) => applySceneTheme(dark))

  // Model
  const modelEntries = [] // { group, model, mixer, baseY, baseX }
  const FLOOR_Y_VAL = FLOOR_Y

  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('/draco/gltf/')
  const gltfLoader = new GLTFLoader()
  gltfLoader.setDRACOLoader(dracoLoader)

  // Build model list: use props.models if available, otherwise fall back to single model props
  const modelConfigs = props.models.length > 0
    ? props.models
    : [{ url: props.modelUrl, animated: props.animated, scale: props.modelScale, posX: props.modelPosX, posY: props.modelPosY, zoom: props.modelZoom }]

  // Compute camera zoom from first model config
  const baseZ = 5.5 - (modelConfigs[0]?.zoom ?? 0)
  camera.position.set(0, 1.2, baseZ)
  camera.lookAt(0, 0.5, 0)

  let totalToLoad = modelConfigs.length
  let loadedCount = 0

  modelConfigs.forEach((cfg) => {
    const modelGroup = new THREE.Group()
    scene.add(modelGroup)
    const entry = { group: modelGroup, model: null, mixer: null, baseY: 0, baseX: 0 }
    modelEntries.push(entry)

    gltfLoader.load(cfg.url, (gltf) => {
      const m = gltf.scene
      const box = new THREE.Box3().setFromObject(m)
      const size = box.getSize(new THREE.Vector3())
      const baseScale = 2.3 / Math.max(size.x, size.y, size.z)
      m.scale.setScalar(baseScale * (cfg.scale ?? 1))
      const sBox = new THREE.Box3().setFromObject(m)
      const sCenter = sBox.getCenter(new THREE.Vector3())
      m.position.set(-sCenter.x, -sBox.min.y, -sCenter.z)
      modelGroup.position.x = cfg.posX ?? 0
      modelGroup.position.y = FLOOR_Y_VAL + 0.1 + (cfg.posY ?? 0)
      entry.baseY = FLOOR_Y_VAL + 0.1 + (cfg.posY ?? 0)
      entry.baseX = cfg.posX ?? 0
      m.traverse(child => {
        if (child.isMesh) {
          child.material.envMapIntensity = 0.8
          if (child.material.map) child.material.map.colorSpace = THREE.SRGBColorSpace
        }
      })
      modelGroup.add(m)
      entry.model = m

      if (cfg.animated && gltf.animations && gltf.animations.length > 0) {
        entry.mixer = new THREE.AnimationMixer(m)
        gltf.animations.forEach(clip => { entry.mixer.clipAction(clip).play() })
      }

      loadedCount++
      if (loadedCount >= totalToLoad) emit('loaded')
    }, (progress) => {
      if (progress.total > 0) emit('progress', Math.round(progress.loaded / progress.total * 100))
    }, () => {
      loadedCount++
      if (loadedCount >= totalToLoad) emit('loaded')
    })
  })

  // Mouse tracking
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
  const onMouseMove = (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2
    mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2
  }
  window.addEventListener('mousemove', onMouseMove)

  // Animate
  const clock = new THREE.Clock()
  function animate() {
    animId = requestAnimationFrame(animate)
    const delta = clock.getDelta()
    const t = clock.getElapsedTime()
    mouse.x += (mouse.tx - mouse.x) * 0.04
    mouse.y += (mouse.ty - mouse.y) * 0.04
    modelEntries.forEach(entry => {
      if (entry.mixer) entry.mixer.update(delta)
      if (entry.model) {
        entry.group.position.y = entry.baseY + Math.sin(t * 0.4) * 0.02
        entry.group.position.x = entry.baseX
        entry.group.rotation.y = mouse.x * 0.25
        entry.group.rotation.x = -mouse.y * 0.08
      }
    })
    camera.position.x = mouse.x * 0.15
    camera.position.y = 1.2 + mouse.y * 0.1
    camera.position.z = baseZ
    camera.lookAt(0, 0.3, 0)
    stars.rotation.y = t * 0.008
    stars.rotation.x = t * 0.003
    renderer.render(scene, camera)
  }
  animate()

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onResize)

  onBeforeUnmount(() => {
    stopWatch()
    if (animId) cancelAnimationFrame(animId)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('resize', onResize)
    renderer.dispose()
  })
})
</script>

<style scoped>
.webgl-canvas { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; }
</style>
