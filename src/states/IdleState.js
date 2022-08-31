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
    if (this.actions.jump && keyboard.pressed.Space)
      this.fsm.setState('jump')

    if (this.actions.attack && keyboard.pressed.Enter)
      this.fsm.setState('attack')

    if (this.actions.special && keyboard.pressed.ControlLeft)
      this.fsm.setState('special')

    for (const key in this.fsm.animKeys)
      if (pressed[key] && this.actions[this.fsm.animKeys[key]])
        this.fsm.setState(this.fsm.animKeys[key])
  }
}
