import * as THREE from 'three'

import { loadFbxAnimations, sample, setButton } from './utils.js'
import IdleState from './states/IdleState.js'
import SpecialState from './states/SpecialState.js'
import { showLoadingError, clearLoadingError } from './loadingError.js'

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
    this.timeSinceLastMove = 0
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

  get shouldReplay() {
    return !randomMoves.checked && this.hasPrevMove
  }

  /* FSM */

  async setState(name) {
    if (!this.actions[name]) {
      this.loading = true
      try {
        const animation = await loadFbxAnimations([name])
        this.actions[name] = this.mixer.clipAction(animation[0])
      } catch (error) {
        console.error('Could not load animation:', name, error)
        this.timeSinceLastMove = 0
        showLoadingError('Could not load this move. Select it again to retry.')
        return false
      } finally {
        this.loading = false
      }
    }

    clearLoadingError()
    this.oldState = this.currentState
    if (this.oldState) {
      if (this.oldState.name == name) return true
      this.oldState.exit()
    }
    const State = moves.includes(name) ? SpecialState : IdleState
    this.currentState = new State(this, name)
    this.currentState.enter(this.oldState)
    return true
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
    if (delta <= 0) return

    this.timeSinceLastMove += delta
    this.currentState?.update()

    if (this.shouldReplay) this.countdown()
    await this.chooseState()

    this.mixer.update(delta)
  }
}
