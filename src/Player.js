import * as THREE from 'three'

import { loadFbxAnimations } from './utils.js'
import IdleState from './states/IdleState.js'
import SpecialState from './states/SpecialState.js'

const disable = btn => {
  btn.disabled = true
  btn.style.pointerEvents = 'none'
}

const enable = btn => {
  btn.disabled = false
  btn.style.pointerEvents = 'auto'
}

export default class Player {
  #loading = false

  constructor({ mesh }) {
    this.mesh = mesh
    this.mixer = new THREE.AnimationMixer(mesh)
    this.actions = {}
    this.buttons = document.querySelectorAll('.idle,.special')
  }

  set loading(isLoading) {
    this.#loading = isLoading
    if (isLoading) this.buttons.forEach(disable)
    else this.buttons.forEach(enable)
  }

  get loading() {
    return this.#loading
  }

  async setState(name, repeat = false) {
    if (!this.actions[name]) {
      this.loading = true
      const animation = await loadFbxAnimations([name])
      this.actions[name] = this.mixer.clipAction(animation[0])
      this.loading = false
    }

    this.oldState = this.currentState
    if (this.oldState) {
      if (this.oldState.name == name) return
      this.oldState.exit()
    }
    const State = repeat ? IdleState : SpecialState
    this.currentState = new State(this, name)
    this.currentState.enter(this.oldState)
  }

  update(delta) {
    this.currentState?.update()
    this.mixer.update(delta)
  }
}
