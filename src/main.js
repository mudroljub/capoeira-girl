import * as THREE from 'three'
import { scene, camera, renderer, loadFbx } from './utils.js'
import Player from './Player.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const clock = new THREE.Clock()
const controls = new OrbitControls(camera, renderer.domElement)
controls.maxPolarAngle = Math.PI / 2 - 0.1

const cameraDefaults = new THREE.Vector3(0, 1.2, 3)
camera.position.copy(cameraDefaults)

const randomMoves = document.getElementById('random-moves')
const speed = document.getElementById('speed')

const interval = 6000 // miliseconds

const { mesh } = await loadFbx({ file: 'assets/fbx/model.fbx', axis: [0, 1, 0], angle: Math.PI })

const player = new Player({ mesh })
await player.setState('Ginga')

scene.add(mesh)

const cameraTarget = new THREE.Vector3(0, cameraDefaults.y, 0)
controls.target = cameraTarget

/* FUNCTIONS */

const toggleCamera = () => {
  const newZ = camera.position.z > 0 ? -4.5 : 3
  camera.position.copy(cameraDefaults)
  camera.position.z = newZ
  camera.lookAt(cameraTarget)
}

/* LOOP */

const title = document.getElementById('title')

void async function loop() {
  requestAnimationFrame(loop)
  const delta = clock.getDelta()

  const secondsLeft = Math.ceil((interval - (Date.now() - player.lastAnimTime)) / 1000)
  console.log(secondsLeft)

  if (!randomMoves.checked && player.isPrevMove && secondsLeft < 4 && secondsLeft > 0)
    title.innerHTML = secondsLeft

  if (player.freeToPlay && secondsLeft <= 0)
    if (randomMoves.checked)
      await player.setRandomMove()
    else if (player.isPrevMove)
      await player.setPrevMove()

  const percent = Number(speed.value) / 100
  player.update(delta * percent)
  controls.update()
  renderer.render(scene, camera)
}()

/* EVENTS */

document.getElementById('camera').addEventListener('click', toggleCamera)

document.addEventListener('click', () => navigator.wakeLock?.request('screen'))

/* HIDE PRELOADER */

document.getElementById('preloader').style.display = 'none'
document.getElementById('title').innerHTML = ''