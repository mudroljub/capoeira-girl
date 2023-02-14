import * as THREE from 'three'
import {
  scene, camera, renderer, sample, loadFbx, loadFbxAnimations
} from './utils.js'
import Player from './Player.js'

const animNames = [
  'Armada', 'Bencao', 'Chapa', 'Chapeu De Couro', 'Au', 'Chapa Giratoria',
  'Chapa Giratoria Back', 'Meia Lua De Frente', 'Meia Lua De Compasso',
  'Meia Lua De Compasso Back', 'Meia Lua De Compasso Double',
  'Martelo Do Chau', 'Martelo Do Chau Sem Mao', 'Ponteira', 'Au To Role',
  'Rasteira', // Rasteira 2
  'Queshada', 'Troca',
  'Martelo', // Martelo 3
  'Macaco', 'Macaco Lateral', 'Esquiva to Role', 'Cocorinha',
  'Esquiva Baixa', 'Esquiva Lateral', 'Armada To Esquiva', 'Backflip',
  // Ginga Variation 1, Ginga Variation 2, Ginga Variation 3, Sequence 1
]

const clock = new THREE.Clock()

const toggleBtn = document.getElementById('checkbox')
const moves = document.getElementsByClassName('move')
const gingas = document.getElementsByClassName('ginga')

const interval = 6000 // miliseconds
let last = Date.now()
let randomMoves = toggleBtn.checked = false

const { mesh } = await loadFbx({ file: 'assets/fbx/model.fbx', axis: [0, 1, 0], angle: Math.PI })
// const animations = await loadFbxAnimations(['Ginga'])
const player = new Player({ mesh })
await player.setState('Ginga')

scene.add(mesh)

/* LOOP */

void async function loop() {
  requestAnimationFrame(loop)
  const delta = clock.getDelta()

  if (Date.now() - last >= interval) {
    if (randomMoves) await player.setState(sample(animNames))
    else if (player.oldState?.name) await player.setState(player.oldState?.name)
    last = Date.now()
  }

  player?.update(delta)
  renderer.render(scene, camera)
}()

/* EVENTS */

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

;[...moves].forEach(btn => {
  btn.addEventListener('click', async e => {
    if (player.currentState?.name !== 'Ginga') return

    await player.setState(e.target.innerText)

    await navigator.wakeLock?.request('screen')
  })
})

;[...gingas].forEach(btn => {
  btn.addEventListener('click', async e => {
    console.log(e.target.innerText)
    // TODO: ne menja stanje nego samo animaciju
  })

})

/* HIDE PRELOADER */

document.getElementById('preloader').style.display = 'none'