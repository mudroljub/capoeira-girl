import State from './State.js'
import keyboard from '../Keyboard.js'
import { syncFrom } from '../utils.js'

const { pressed } = keyboard

export default class IdleState extends State {
  enter(oldState) {
    const curAction = this.actions.idle
    if (oldState) {
      const oldAction = this.actions[oldState.name]
      syncFrom(['walk', 'run', 'walkBackward'], oldState, oldAction, curAction)
    }
    curAction.play()
  }

  update() {
    if (this.actions.walk && pressed.KeyW)
      this.fsm.setState('walk')

    if (this.actions.walkBackward && pressed.KeyS)
      this.fsm.setState('walkBackward')

    if (this.actions.jump && keyboard.pressed.Space)
      this.fsm.setState('jump')

    if (this.actions.attack && keyboard.pressed.Enter)
      this.fsm.setState('attack')

    if (this.actions.special && keyboard.pressed.ControlLeft)
      this.fsm.setState('special')

    if (this.fsm.animKeys)
      for (const key in this.fsm.animKeys)
        if (pressed[key]) this.fsm.setState(this.fsm.animKeys[key])
  }
}
