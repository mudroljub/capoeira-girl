import State from './State.js'
import keyboard from '../keyboard.js'

const { pressed } = keyboard
const duration = .75

export default class IdleState extends State {
  enter(oldState) {
    const curAction = this.actions.idle
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

  update() {
    for (const key in this.player.animKeys)
      if (pressed[key] && this.actions[this.player.animKeys[key]])
        this.player.setState(this.player.animKeys[key])
  }
}
