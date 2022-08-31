import * as THREE from 'three'
import { FBXLoader } from 'https://unpkg.com/three@0.134.0/examples/jsm/loaders/FBXLoader.js'

/* CAMERA */

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000)

/* RENDERER */

export const renderer = new THREE.WebGLRenderer({ alpha: true })
document.body.appendChild(renderer.domElement)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.domElement.focus()
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
// fix fbx model light
renderer.gammaFactor = 2.2
renderer.outputEncoding = THREE.GammaEncoding

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
})

renderer.domElement.addEventListener('contextmenu', e => e.preventDefault())

/* UI */

const isTouchDevice = () => 'ontouchstart' in window

const sortForMobile = commands => {
  const sorted = Object.keys(commands).sort((a, b) => commands[a].length - commands[b].length)

  const firstArr = []
  const secondArr = []
  for (let i = sorted.length - 1; i >= 0; i--)
    if (i % 2)
      firstArr.push(sorted[i])
    else
      secondArr.unshift(sorted[i])

  return [...firstArr, ...secondArr]
}

const translateKey = key => {
  key = key.replace(/Key/, '') // eslint-disable-line no-param-reassign
  switch (key) {
    case 'ArrowLeft':
      return '←'
    case 'ArrowRight':
      return '→'
    case 'ArrowUp':
      return '↑'
    case 'ArrowDown':
      return '↓'
    default:
      return key
  }
}

export function addUI({ commands, pressKey } = {}) {
  const containerStyle = `
    color: #fff;
    left: 4px;
    position: absolute;
    top: 4px;
    overflow-y: auto;
    max-height: 100vh;
    direction: rtl;
    display: flex;
    flex-direction: column;
    align-items: end;
  `
  const rowStyle = `
    display: block;
    margin-top: 1px;
    margin-bottom: 1px;
    direction: ltr;
  `
  const keyStyle = `
    border: 1px solid #fff;
    padding: 0 2px;
    min-width: 12px;
    display: inline-block;
    text-align: center;
  `
  const div = document.createElement('div')
  div.style = containerStyle

  const keys = isTouchDevice() ? sortForMobile(commands) : Object.keys(commands)

  keys.forEach(key => {
    const btn = document.createElement('button')
    btn.style = rowStyle
    btn.addEventListener('click', () => pressKey(key))
    const keyCode = `<b style="${keyStyle}">${translateKey(key)}</b>`
    btn.innerHTML = `<span>${isTouchDevice() ? '' : keyCode} ${commands[key]}</span>`
    div.appendChild(btn)
  })

  document.body.appendChild(div)
}

/* SUN */

export function createSun({ position = [25, 30, 40], r = 1 } = {}) {
  const spotLight = new THREE.SpotLight(0xffffff)
  spotLight.shadow.mapSize.width = 2048
  spotLight.shadow.mapSize.height = 2048
  spotLight.shadow.camera.fov = 15
  spotLight.castShadow = true
  spotLight.decay = 2
  spotLight.penumbra = 0.05

  const ambientLight = new THREE.AmbientLight(0x343434)

  const container = new THREE.Mesh(
    new THREE.SphereGeometry(r),
    new THREE.MeshToonMaterial({ color: 0xFCE570 })
  )
  container.add(spotLight, ambientLight)
  container.position.set(...position)
  return container
}

/* GROUND */

export function createGroundMaterial({ color = 0x509f53 } = {}) {
  const params = { side: THREE.FrontSide }
  const material = new THREE.MeshPhongMaterial({ ...params, color }) // MeshLambertMaterial ne radi rasveta
  return material
}

export function crateGroundGeometry({ size, segments = 32, circle = true }) {
  const geometry = circle
    ? new THREE.CircleGeometry(size, segments)
    : new THREE.PlaneGeometry(size, size)

  geometry.rotateX(-Math.PI * 0.5)
  return geometry
}

export function createGround({ size = 1000, color, circle } = {}) {
  const material = createGroundMaterial({ color })
  const geometry = crateGroundGeometry({ size, circle })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.receiveShadow = true
  return mesh
}

/* LOADERS */

const getSize = (mesh, axis) => {
  const box = new THREE.Box3().setFromObject(mesh)
  return box.max[axis] - box.min[axis]
}

const getScale = (mesh, newHeight) => {
  const height = getSize(mesh, 'y')
  const scale = newHeight / height
  return scale
}

/* group preserves model orientation */
const createGroup = model => {
  const group = new THREE.Group()
  group.add(model)
  return group
}

const prepareMesh = ({ model, size = 2, angle, axis, animations }) => {
  const scale = size ? getScale(model, size) : 1
  model.scale.set(scale, scale, scale)

  model.traverse(child => {
    if (child.isMesh) child.castShadow = child.receiveShadow = true
  })
  if (angle) model.rotateOnWorldAxis(new THREE.Vector3(...axis), angle)

  return { mesh: createGroup(model), animations }
}

export async function loadFbx(params) {
  const loader = new FBXLoader()
  const model = await loader.loadAsync(params.file)
  if (model.animations.length)
    model.animations[0].name = params.name

  return prepareMesh({ model, animations: model.animations, ...params })
}

export async function loadFbxAnimations(names, prefix = 'assets/fbx/') {
  const promises = []

  if (Array.isArray(names))
    for (const name of names) {
      const promise = loadFbx({ name, file: prefix + name + '.fbx' })
      promises.push(promise)
    } else if (typeof names === 'object')
    for (const name in names) {
      const promise = loadFbx({ name, file: prefix + names[name] + '.fbx' })
      promises.push(promise)
    }

  const responses = await Promise.all(promises)
  return responses.map(res => res.animations[0])
}

export const syncFrom = (names, oldState, oldAction, curAction, duration = .75) => {
  curAction.enabled = true
  curAction.timeScale = 1
  if (names.includes(oldState.name)) {
    const ratio = curAction.getClip().duration / oldAction.getClip().duration
    curAction.time = oldAction.time * ratio // sync legs
  } else {
    curAction.time = 0.0
    curAction.setEffectiveTimeScale(1)
    curAction.setEffectiveWeight(1)
  }
  curAction.crossFadeFrom(oldAction, duration, true)
}

export const sample = arr => arr[Math.floor(Math.random() * arr.length)]