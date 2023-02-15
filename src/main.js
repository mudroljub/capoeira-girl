import * as THREE from 'three'
import { scene, camera, renderer, sample, loadFbx } from './utils.js'
import Player from './Player.js'
import GingaState from './states/GingaState.js'

const clock = new THREE.Clock()

const toggleBtn = document.getElementById('checkbox')
const moves = document.getElementsByClassName('move')
const speed = document.getElementById('speed')

const animNames = [...moves].map(btn => btn.innerText)

const interval = 6000 // miliseconds
let last = Date.now()
let randomMoves = toggleBtn.checked = false

const { mesh } = await loadFbx({ file: 'assets/fbx/model.fbx', axis: [0, 1, 0], angle: Math.PI })

const player = new Player({ mesh })
await player.setState('Ginga')

scene.add(mesh)

/* LOOP */

void async function loop() {
  requestAnimationFrame(loop)
  const delta = clock.getDelta()

  if (Date.now() - last >= interval) {
    if (randomMoves)
      await player.setState(sample(animNames))
    else if (animNames.includes(player.oldState?.name))
      await player.setState(player.oldState.name)
    last = Date.now()
  }

  const percent = Number(speed.value) / 100
  player.update(delta * percent)
  renderer.render(scene, camera)
}()

/* EVENTS */

const playAction = async e => {
  await player.setState(e.target.innerText)
  last = Date.now()
  await navigator.wakeLock?.request('screen')
}

document.getElementsByClassName('ginga').forEach(btn =>
  btn.addEventListener('click', playAction)
)

moves.forEach(btn =>
  btn.addEventListener('click', async e => {
    if (player.currentState instanceof GingaState) playAction(e)
  })
)

toggleBtn.addEventListener('click', () => {
  randomMoves = !randomMoves
})

document.getElementById('camera').addEventListener('click', () => {
  camera.position.z = camera.position.z > 0 ? -4.5 : 3
  camera.lookAt(new THREE.Vector3(0, camera.position.y, 0))
})

document.getElementById('fullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement)
    document.documentElement.requestFullscreen()
  else if (document.exitFullscreen)
    document.exitFullscreen()
})

/* HIDE PRELOADER */

document.getElementById('preloader').style.display = 'none'
document.getElementById('title').innerHTML = ''