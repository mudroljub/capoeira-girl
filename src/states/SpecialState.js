import * as THREE from 'three'
import State from './State.js'

const duration = .25
const title = document.getElementById('title')

export default class SpecialState extends State {
  constructor(...args) {
    super(...args)
    this._FinishedCallback = this._FinishedCallback.bind(this)
  }

  enter(oldState) {
    title.innerHTML = this.name
    const curAction = this.actions[this.name]
    const mixer = curAction.getMixer()
    mixer.addEventListener('finished', this._FinishedCallback)

    if (oldState) {
      const oldAction = oldState.currentAction
      curAction.reset()
      curAction.setLoop(THREE.LoopOnce, 1)
      curAction.clampWhenFinished = true
      curAction.crossFadeFrom(oldAction, duration, true)
    }
    curAction.play()
  }

  _Cleanup() {
    this.actions[this.name].getMixer().removeEventListener('finished', this._FinishedCallback)
  }

  _FinishedCallback() {
    this._Cleanup()
    this.player.setState(this.player.oldState.name || 'Ginga')
  }

  exit() {
    this._Cleanup()
    title.innerHTML = ''
  }
}