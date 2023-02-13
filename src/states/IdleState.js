import State from './State.js'

const duration = .75

export default class IdleState extends State {
  enter(oldState) {
    const curAction = this.actions.Ginga
    if (oldState) {
      const oldAction = this.actions[oldState.name]
      curAction.enabled = true
      curAction.timeScale = 1
      curAction.time = 0.0
      curAction.setEffectiveTimeScale(1)
      curAction.setEffectiveWeight(1)
      curAction.crossFadeFrom(oldAction, duration, true)
    }
    curAction.play()
  }
}
