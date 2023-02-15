import * as THREE from 'three'

import { loadFbxAnimations } from './utils.js'
import GingaState from './states/GingaState.js'
import SpecialState from './states/SpecialState.js'

const states = {
  Ginga: GingaState,
  'Ginga Variation 1': GingaState,
  'Ginga Variation 2': GingaState,
  'Ginga Variation 3': GingaState,
}

const disable = btn => {
  btn.disabled = true
  btn.style.pointerEvents = 'none'
}

const enable = btn => {
  btn.disabled = false
  btn.style.pointerEvents = 'auto'
}

export default class Player {
  constructor({ mesh }) {
    this.mesh = mesh
    this.mixer = new THREE.AnimationMixer(mesh)
    this.actions = {}
    this.buttons = document.querySelectorAll('.ginga,.move')
  }

  async setState(name) {
    if (!this.actions[name]) {
      this.buttons.forEach(disable)
      const animation = await loadFbxAnimations([name])
      this.actions[name] = this.mixer.clipAction(animation[0])
      this.buttons.forEach(enable)
    }

    this.oldState = this.currentState
    if (this.oldState) {
      if (this.oldState.name == name) return
      this.oldState.exit()
    }
    const State = states[name] || SpecialState
    this.currentState = new State(this, name)
    this.currentState.enter(this.oldState)
  }

  update(delta) {
    this.currentState?.update()
    this.mixer.update(delta)
  }
}
