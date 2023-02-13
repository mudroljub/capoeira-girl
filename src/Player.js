import * as THREE from 'three'

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
  constructor({ mesh, animations, animKeys }) {
    this.mesh = mesh
    this.mixer = new THREE.AnimationMixer(mesh)
    this.actions = animationsToActions(animations, this.mixer)
    this.animKeys = animKeys
    this.setState('idle')
  }

  addAnimation(clip) {
    this.actions[clip.name] = this.mixer.clipAction(clip)
  }

  setState(name) {
    const oldState = this.currentState
    if (oldState) {
      if (oldState.name == name) return
      oldState.exit()
    }
    const State = states[name] || SpecialState
    this.currentState = new State(this, name)
    this.currentState.enter(oldState)
  }

  update(delta) {
    this.currentState.update()
    this.mixer.update(delta)
  }
}
