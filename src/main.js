import * as THREE from 'three'
import { scene, camera, renderer, controls, clock, loadFbx } from './utils.js'
import Player from './Player.js'

const speed = document.getElementById('speed')

const defaultCameraPos = new THREE.Vector3(0, 1.2, 3)
camera.position.copy(defaultCameraPos)

const cameraTarget = new THREE.Vector3(0, defaultCameraPos.y, 0)
controls.target = cameraTarget

const { mesh } = await loadFbx({ file: 'assets/fbx/model.fbx', axis: [0, 1, 0], angle: Math.PI })

const player = new Player({ mesh })
await player.setState('Ginga')

scene.add(mesh)

// scene.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1))

/* FUNCTIONS */

const toggleCamera = () => {
  const newZ = camera.position.z > 0 ? -4.5 : 3
  camera.position.copy(defaultCameraPos)
  camera.position.z = newZ
  camera.lookAt(cameraTarget)
}

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

/* HIDE PRELOADER */

document.getElementById('preloader').style.display = 'none'
document.getElementById('title').innerHTML = ''