import * as THREE from 'three'
import {
  camera, renderer, addUI, createSun, createGround, sample, loadFbx, loadFbxAnimations
} from './utils.js'
import Player from './Player.js'
import { animKeys } from './data.js'

const scene = new THREE.Scene()
const clock = new THREE.Clock()

const title = document.getElementById('title')
const toggleBtn = document.getElementById('checkbox')

let lastKey, time = 0, lastTime = 0, loading = false
let autoplay = toggleBtn.checked = true

const sun = createSun()
scene.add(sun)

camera.position.set(0, 1, 3)

scene.add(createGround({ size: 100, color: 0xF2D16B }))

addUI({ commands: animKeys, playAnim })

const { mesh } = await loadFbx({ file: 'assets/fbx/model.fbx', axis: [0, 1, 0], angle: Math.PI })
const animations = await loadFbxAnimations({ idle: 'Ginga' })
const player = new Player({ mesh, animations, animKeys })

scene.add(mesh)

/* FUNCTIONS */

// TODO: setState(name) on click

async function playAnim(name) {
  if (player?.currentState.name !== 'idle') return

  lastTime = time
  lastKey = name
  title.innerHTML = name

  if (!player.actions[name]) {
    loadAnim(name)
    return
  }

  player.setState(name)

  setTimeout(() => {
    title.innerHTML = ''
  }, 2500)

  await navigator.wakeLock?.request('screen')
}

async function loadAnim(name) {
  if (loading) return
  loading = true
  const animation = await loadFbxAnimations([name])
  player.addAnimation(animation[0])
  loading = false
  playAnim(name)
}

/* LOOP */

void function loop() {
  requestAnimationFrame(loop)
  const delta = clock.getDelta()
  time++

  const name = 'Prd' //

  if (animKeys[name]) // if includes
    playAnim(name)
  else if (time - lastTime >= 60 * 8) // TODO: refactor to frame indepentent
    if (autoplay) playAnim(sample(Object.keys(animKeys)))
    else if (lastKey) playAnim(lastKey)

  player?.update(delta)
  renderer.render(scene, camera)
}()

/* EVENTS */

toggleBtn.addEventListener('click', () => {
  autoplay = !autoplay
  lastKey = null
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

/* LATE LOAD */

document.getElementById('preloader').style.display = 'none'
title.innerHTML = ''