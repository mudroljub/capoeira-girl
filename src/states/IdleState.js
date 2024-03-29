import State from './State.js'

const duration = .2
const title = document.getElementById('title')

export default class IdleState extends State {
  enter(oldState) {
    title.innerHTML = ''
    this.currentAction = this.actions[this.name]
    if (oldState) {
      const oldAction = this.actions[oldState.name]
      this.currentAction.enabled = true
      this.currentAction.timeScale = 1
      this.currentAction.time = 0.0
      this.currentAction.setEffectiveTimeScale(1)
      this.currentAction.setEffectiveWeight(1)
      this.currentAction.crossFadeFrom(oldAction, duration, true)
    }
    this.currentAction.play()
  }
}
