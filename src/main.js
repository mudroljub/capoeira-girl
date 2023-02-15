import * as THREE from 'three'
import { scene, camera, renderer, sample, loadFbx } from './utils.js'
import Player from './Player.js'
import IdleState from './states/IdleState.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const clock = new THREE.Clock()
const controls = new OrbitControls(camera, renderer.domElement)
controls.maxPolarAngle = Math.PI / 2 - 0.1

const cameraDefaults = new THREE.Vector3(0, 1.2, 3)
camera.position.copy(cameraDefaults)

const moves = document.querySelectorAll('.special')
const randomMoves = document.getElementById('random-moves')
const speed = document.getElementById('speed')

const moveNames = [...moves].map(btn => btn.innerText)

const interval = 6000 // miliseconds
let last = Date.now()

const { mesh } = await loadFbx({ file: 'assets/fbx/model.fbx', axis: [0, 1, 0], angle: Math.PI })

const player = new Player({ mesh })
await player.setState('Ginga', true)

scene.add(mesh)

const cameraTarget = new THREE.Vector3(0, cameraDefaults.y, 0)
controls.target = cameraTarget

/* FUNCTIONS */

const playAction = async(e, repeat) => {
  await player.setState(e.target.innerText, repeat)
  last = Date.now()
  await navigator.wakeLock?.request('screen')
}

const toggleCamera = () => {
  const newZ = camera.position.z > 0 ? -4.5 : 3
  camera.position.copy(cameraDefaults)
  camera.position.z = newZ
  camera.lookAt(cameraTarget)
}

/* LOOP */

void async function loop() {
  requestAnimationFrame(loop)
  const delta = clock.getDelta()

  if (!player.loading && Date.now() - last >= interval) {
    if (randomMoves.checked)
      await player.setState(sample(moveNames))
    else if (moveNames.includes(player.oldState?.name))
      await player.setState(player.oldState.name)
    last = Date.now()
  }

  const percent = Number(speed.value) / 100
  player.update(delta * percent)
  controls.update()
  renderer.render(scene, camera)
}()

/* EVENTS */

document.querySelectorAll('.idle').forEach(btn =>
  btn.addEventListener('click', e => playAction(e, true))
)

moves.forEach(btn =>
  btn.addEventListener('click', async e => {
    if (player.currentState instanceof IdleState) playAction(e, false)
  })
)

document.getElementById('camera').addEventListener('click', toggleCamera)

/* HIDE PRELOADER */

document.getElementById('preloader').style.display = 'none'
document.getElementById('title').innerHTML = ''