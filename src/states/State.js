export default class State {
  constructor(player, name) {
    this.player = player
    this.actions = player.actions
    this.name = name
  }

  enter() {}

  exit() {}

  update() {}
}