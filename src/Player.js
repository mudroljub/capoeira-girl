import * as THREE from 'three'

import { loadFbxAnimations } from './utils.js'
import GingaState from './states/GingaState.js'
import SpecialState from './states/SpecialState.js'

const states = {
  Ginga: GingaState,
}

export default class Player {
  constructor({ mesh }) {
    this.mesh = mesh
    this.mixer = new THREE.AnimationMixer(mesh)
    this.actions = {}
  }

  async loadAnimation(name) {
    const animation = await loadFbxAnimations([name])
    this.actions[animation[0].name] = this.mixer.clipAction(animation[0])
  }

  async setState(name) {
    if (!this.actions[name]) {
      await this.loadAnimation(name)
      this.setState(name)
      return
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
