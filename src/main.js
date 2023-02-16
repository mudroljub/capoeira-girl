import * as THREE from 'three'
import { scene, camera, renderer, controls, clock, loadFbx } from './utils.js'
import Player from './Player.js'

const speed = document.getElementById('speed')
const checkboxes = document.querySelectorAll('.tab input')

const defaultCameraPos = new THREE.Vector3(0, .9, 2.75)
camera.position.copy(defaultCameraPos)

const cameraTarget = new THREE.Vector3(0, defaultCameraPos.y, 0)
controls.target = cameraTarget

const { mesh } = await loadFbx({ file: 'assets/fbx/model.fbx', axis: [0, 1, 0], angle: Math.PI })

const player = new Player({ mesh })
await player.setState('Ginga')

scene.add(mesh)

/* FUNCTIONS */

const toggleCamera = () => {
  const newZ = camera.position.z > 0 ? -defaultCameraPos.z * 1.2 : defaultCameraPos.z
  const newY = camera.position.z > 0 ? defaultCameraPos.y * .75 : defaultCameraPos.y
  camera.position.set(defaultCameraPos.x, newY, newZ)
  cameraTarget.y = newY
}

const closeOthers = e => checkboxes.forEach(el => {
  if (el !== e.target) el.checked = false
})

/* LOOP */

void async function loop() {
  requestAnimationFrame(loop)
  const delta = clock.getDelta()

  const speedPercent = Number(speed.value) / 100
  await player.update(delta * speedPercent)

  controls.update()
  renderer.render(scene, camera)
}()

/* EVENTS */

document.getElementById('camera').addEventListener('click', toggleCamera)

document.addEventListener('click', () => navigator.wakeLock?.request('screen'))

document.getElementById('mirror').addEventListener('click', () =>
  mesh.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1))
)

checkboxes.forEach(el => el.addEventListener('change', closeOthers))

/* HIDE PRELOADER */

document.getElementById('preloader').style.display = 'none'
document.getElementById('title').innerHTML = ''