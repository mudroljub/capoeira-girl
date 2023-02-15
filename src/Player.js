import * as THREE from 'three'

import { loadFbxAnimations, sample } from './utils.js'
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
    this.lastAnimTime = Date.now()
    this.buttons = document.querySelectorAll('.idle,.special')
    this.moves = document.querySelectorAll('.special')
    this.moveNames = [...this.moves].map(btn => btn.innerText)

    this.buttons.forEach(btn => btn.addEventListener('click', e => {
      if (this.freeToPlay) this.setState(e.target.innerText)
    }))
  }

  /* GETTERS & SETTERS */

  set loading(isLoading) {
    this.#loading = isLoading
    if (isLoading) this.buttons.forEach(disable)
    else this.buttons.forEach(enable)
  }

  get loading() {
    return this.#loading
  }

  get isIdle() {
    return this.currentState instanceof IdleState
  }

  get freeToPlay() {
    return !this.loading && this.isIdle
  }

  get isPrevMove() {
    return this.isMove(this.oldState?.name)
  }

  /* HELPERS */

  isMove(name) {
    return this.moveNames.includes(name)
  }

  setPrevMove() {
    return this.setState(this.oldState.name)
  }

  setRandomMove() {
    return this.setState(sample(this.moveNames))
  }

  /* FSM */

  async setState(name) {
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
    const State = this.isMove(name) ? SpecialState : IdleState
    this.currentState = new State(this, name)
    this.currentState.enter(this.oldState)
  }

  update(delta) {
    this.currentState?.update()
    this.mixer.update(delta)
  }
}
