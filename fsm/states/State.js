export default class State {
  constructor(fsm, name) {
    this.fsm = fsm
    this.actions = fsm.actions
    this.name = name
  }

  enter() {}

  exit() {}

  update() {}
}