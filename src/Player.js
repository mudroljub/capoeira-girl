import * as THREE from 'three'

import { loadFbxAnimations, sample, setButton } from './utils.js'
import IdleState from './states/IdleState.js'
import SpecialState from './states/SpecialState.js'

const title = document.getElementById('title')
const randomMoves = document.getElementById('random-moves')
const buttons = document.querySelectorAll('.idle,.special')
const moves = [...document.querySelectorAll('.special')].map(btn => btn.innerText)

export default class Player {
  #loading = false

  constructor({ mesh }) {
    this.mesh = mesh
    this.mixer = new THREE.AnimationMixer(mesh)
    this.actions = {}
    this.lastAnimTime = Date.now()
    this.interval = 6 // seconds

    buttons.forEach(btn => btn.addEventListener('click', e => {
      if (this.isReady) this.setState(e.currentTarget.innerText)
    }))
  }

  /* GETTERS & SETTERS */

  set loading(isLoading) {
    this.#loading = isLoading
    buttons.forEach(btn => setButton(btn, isLoading))
  }

  get loading() {
    return this.#loading
  }

  get isIdle() {
    return this.currentState instanceof IdleState
  }

  get isReady() {
    return !this.loading && this.isIdle
  }

  get hasPrevMove() {
    return moves.includes(this.oldState?.name)
  }

  get timeSinceLastMove() {
    return (Date.now() - this.lastAnimTime) / 1000
  }

  get shouldReplay() {
    return !randomMoves.checked && this.hasPrevMove
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
    const State = moves.includes(name) ? SpecialState : IdleState
    this.currentState = new State(this, name)
    this.currentState.enter(this.oldState)
  }

  /* UPDATE */

  countdown() {
    const secondsLeft = Math.ceil(this.interval - this.timeSinceLastMove)
    if (secondsLeft < 4 && secondsLeft > 0)
      title.innerHTML = secondsLeft
  }

  async chooseState() {
    if (this.isReady && this.timeSinceLastMove > this.interval)
      if (this.shouldReplay)
        await this.setState(this.oldState.name)
      else if (randomMoves.checked)
        await this.setState(sample(moves))
  }

  async update(delta) {
    this.currentState?.update()

    if (this.shouldReplay) this.countdown()
    await this.chooseState()

    this.mixer.update(delta)
  }
}
