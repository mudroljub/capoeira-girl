import * as THREE from 'three'

import { loadFbxAnimations } from './utils.js'
import IdleState from './states/IdleState.js'
import SpecialState from './states/SpecialState.js'

const states = {
  idle: IdleState,
}

export const animationsToActions = (animations, mixer) => animations.reduce((dict, clip) => ({
  ...dict,
  [clip.name]: mixer.clipAction(clip)
}), {})

export default class Player {
  constructor({ mesh, animations }) {
    this.mesh = mesh
    this.mixer = new THREE.AnimationMixer(mesh)
    this.actions = animationsToActions(animations, this.mixer)
    this.setState('idle')
  }

  async loadAnimation(name) {
    const animation = await loadFbxAnimations([name])
    this.addAnimation(animation[0])
  }

  addAnimation(clip) {
    this.actions[clip.name] = this.mixer.clipAction(clip)
  }

  async playAnim(name) {
    if (this.currentState?.name !== 'idle') return

    if (!this.actions[name]) {
      await this.loadAnimation(name)
      this.playAnim(name)
      return
    }

    this.setState(name)

    await navigator.wakeLock?.request('screen')
  }

  setState(name) {
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
    this.currentState.update()
    this.mixer.update(delta)
  }
}
