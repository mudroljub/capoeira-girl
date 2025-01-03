import * as THREE from 'three'
import { FBXLoader } from 'https://unpkg.com/three@0.134.0/examples/jsm/loaders/FBXLoader.js'
import { OrbitControls } from '../libs/OrbitControls.js'

export const clock = new THREE.Clock()

export const scene = new THREE.Scene()
const sun = createSun()
scene.add(sun)

scene.add(createGround({ size: 100, color: 0xF8B735 }))

/* CAMERA */

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000)

/* RENDERER */

export const renderer = new THREE.WebGLRenderer({ alpha: true })
document.body.appendChild(renderer.domElement)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.domElement.focus()
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
// fix lights
renderer.gammaFactor = 2.2
renderer.outputEncoding = THREE.GammaEncoding

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
})

renderer.domElement.addEventListener('contextmenu', e => e.preventDefault())

export const controls = new OrbitControls(camera, renderer.domElement)

controls.maxPolarAngle = Math.PI / 2 - 0.1
controls.maxDistance = 20
controls.minDistance = 2
controls.zoomSpeed = .3

/* SUN */

export function createSun({ position = [20, 20, 30], r = 1 } = {}) {
  const spotLight = new THREE.SpotLight(0xffffff, .75)
  spotLight.shadow.mapSize.width = 2048
  spotLight.shadow.mapSize.height = 2048
  spotLight.castShadow = true

  const ambientLight = new THREE.AmbientLight(0xEDD59E, .5)

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

export const sample = arr => arr[Math.floor(Math.random() * arr.length)]

export const setButton = (btn, disabled) => {
  btn.disabled = disabled
  btn.style.pointerEvents = disabled ? 'none' : 'auto'
}
