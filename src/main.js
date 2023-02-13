import * as THREE from 'three'
import {
  camera, renderer, addUI, createSun, createGround, sample, loadFbx, loadFbxAnimations
} from './utils.js'
import keyboard from './keyboard.js'
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

addUI({ commands: animKeys, pressKey })

const { mesh } = await loadFbx({ file: 'assets/fbx/model.fbx', axis: [0, 1, 0], angle: Math.PI })
const animations = await loadFbxAnimations({ idle: 'Ginga' })
const stateMachine = new Player({ mesh, animations, animKeys })

scene.add(mesh)

/* FUNCTIONS */

async function loadAnim(key) {
  if (loading) return
  loading = true
  const animation = await loadFbxAnimations([animKeys[key]])
  stateMachine.addAnimation(animation[0])
  loading = false
  pressKey(key)
}

async function pressKey(key) {
  if (stateMachine?.currentState.name !== 'idle') return

  lastTime = time
  lastKey = key
  title.innerHTML = animKeys[key]

  if (!stateMachine.actions[animKeys[key]]) {
    loadAnim(key)
    return
  }

  keyboard.pressed[key] = true
  setTimeout(() => keyboard.reset(), 100)

  setTimeout(() => {
    title.innerHTML = ''
  }, 2500)

  await navigator.wakeLock?.request('screen')
}

/* LOOP */

void function loop() {
  requestAnimationFrame(loop)
  const delta = clock.getDelta()
  time++

  const key = Object.keys(keyboard.pressed)[0]

  if (animKeys[key])
    pressKey(key)
  else if (time - lastTime >= 60 * 8)
    if (autoplay) pressKey(sample(Object.keys(animKeys)))
    else if (lastKey) pressKey(lastKey)

  stateMachine?.update(delta)
  renderer.render(scene, camera)
}()

/* EVENTS */

toggleBtn.addEventListener('click', () => {
  autoplay = !autoplay
  lastKey = null
})

document.getElementById('camera').addEventListener('click', () => {
  // sun.position.z = -sun.position.z
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