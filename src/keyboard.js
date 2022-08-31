/*
* Singleton object for user input (including keyboard, touchscreen and mouse)
* see keycode.info
*/
class Keyboard {

  constructor() {
    this.pressed = {}
    this.capsLock = false

    document.addEventListener('keydown', e => {
      e.preventDefault()
      this.pressed[e.code] = true
    })
    document.addEventListener('keyup', e => {
      delete this.pressed[e.code]
      this.capsLock = e.getModifierState('CapsLock')
    })

    document.addEventListener('pointerdown', e => this.handleMouseDown(e))
    document.addEventListener('pointerup', e => this.handleMouseUp(e))

    document.addEventListener('mousedown', e => this.handleMouseDown(e))
    document.addEventListener('mouseup', e => this.handleMouseUp(e))

    document.addEventListener('visibilitychange', () => this.reset())
    window.addEventListener('blur', () => this.reset())
  }

  handleMouseDown(e) {
    if (e.button === 0)
      this.pressed.mouse = true
    if (e.button === 2)
      this.pressed.mouse2 = true
  }

  handleMouseUp(e) {
    if (e.button === 0)
      delete this.pressed.mouse

    if (e.button === 2)
      delete this.pressed.mouse2
  }

  reset() {
    for (const key in this.pressed) delete this.pressed[key]
  }

  /* GETTERS */

  get up() {
    return this.pressed.ArrowUp || this.pressed.KeyW
  }

  get down() {
    return this.pressed.ArrowDown || this.pressed.KeyS
  }

  get left() {
    return this.pressed.ArrowLeft || this.pressed.KeyA
  }

  get right() {
    return this.pressed.ArrowRight || this.pressed.KeyD
  }

  get space() {
    return this.pressed.Space
  }

  get backspace() {
    return this.pressed.Backspace
  }

  get shift() {
    return this.pressed.ShiftLeft || this.pressed.ShiftRight
  }

  get arrowPressed() {
    return this.pressed.ArrowRight || this.pressed.ArrowLeft || this.pressed.ArrowDown || this.pressed.ArrowUp
  }

  get controlsPressed() {
    return this.arrowPressed || this.pressed.KeyW || this.pressed.KeyA || this.pressed.KeyS || this.pressed.KeyD
  }

  get totalPressed() {
    return Object.values(this.pressed).filter(x => x).length
  }

  get keyPressed() {
    return this.totalPressed > 0
  }
}

export default new Keyboard
