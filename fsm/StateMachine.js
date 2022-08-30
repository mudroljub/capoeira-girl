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

export default class StateMachine {
  constructor({ mesh, animations, animKeys }) {
    this.mesh = mesh
    this.mixer = new THREE.AnimationMixer(mesh)
    this.actions = animationsToActions(animations, this.mixer)
    if (this.actions.walk) this.actions.walkBackward = this.actions.walk
    this.animKeys = animKeys
    this.setState('idle')
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
