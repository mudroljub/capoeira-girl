import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'

async function createApp({ failModel = false, failAnimation = false, wakeLock } = {}) {
  const elements = new Map()
  const listeners = new Map()
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      hidden: true, style: {}, checked: false, value: '100',
      addEventListener() {}, focusCalls: 0,
      focus() {
        this.focusCalls++
        context.document.activeElement = this
      },
    })
    return elements.get(id)
  }
  const buttons = ['Ginga', 'Ponteira'].map(innerText => ({
    innerText, style: {}, disabled: false, addEventListener() {},
  }))
  const requests = []
  let reloads = 0
  let frames = 0
  let now = Date.now()
  class AnimationMixer {
    update() {}
    addEventListener() {}
    removeEventListener() {}
    clipAction() {
      return {
        getMixer: () => this, reset() {}, setLoop() {}, play() {},
        setEffectiveTimeScale() {}, setEffectiveWeight() {}, crossFadeFrom() {},
      }
    }
  }
  const context = vm.createContext({
    Date: class extends Date {
      static now() { return now }
    },
    console: { error() {}, warn() {} },
    document: {
      getElementById: element,
      querySelectorAll: selector => selector === '.special' ? [buttons[1]]
        : selector === '.tab input' ? [] : buttons,
      addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, [])
        listeners.get(type).push(listener)
      },
    },
    window: { location: { reload() { reloads++ } } },
    navigator: wakeLock ? { wakeLock } : {},
    requestAnimationFrame() { frames++ },
  })
  const dependencies = {
    three: { AnimationMixer, Vector3: class {}, LoopOnce: 1 },
    utils: {
      loadFbx: async () => {
        if (failModel) throw new Error('Model unavailable')
        return { mesh: {} }
      },
      loadFbxAnimations: async names => {
        requests.push(...names)
        if (failAnimation) throw new Error('Animation unavailable')
        return [{}]
      },
      sample: items => items[0],
      setButton: (button, disabled) => { button.disabled = disabled },
      camera: { position: { copy() {} } },
      scene: { add() {} }, renderer: { render() {} },
      controls: { update() {} }, clock: { getDelta: () => 0.016 },
    },
  }
  const modules = new Map()
  async function getModule(url) {
    const key = url.href
    if (modules.has(key)) return modules.get(key)
    const exports = dependencies[key === 'three' ? 'three' : url.pathname.endsWith('/utils.js') ? 'utils' : '']
    const module = exports
      ? new vm.SyntheticModule(Object.keys(exports), function() {
        for (const [name, value] of Object.entries(exports)) this.setExport(name, value)
      }, { context, identifier: key })
      : new vm.SourceTextModule(await readFile(url, 'utf8'), { context, identifier: key })
    modules.set(key, module)
    return module
  }
  async function load(file) {
    const module = await getModule(new URL(file, import.meta.url))
    await module.link((specifier, parent) => getModule(specifier === 'three'
      ? { href: 'three', pathname: '' } : new URL(specifier, parent.identifier)))
    await module.evaluate()
    return module.namespace
  }
  return {
    load, element, buttons, requests,
    allowAnimations() { failAnimation = false },
    rejectAnimations() { failAnimation = true },
    advanceTime(milliseconds) { now += milliseconds },
    async click() {
      await Promise.all((listeners.get('click') ?? []).map(listener => listener()))
    },
    keydown(code) {
      const event = { code, defaultPrevented: false, preventDefault() { this.defaultPrevented = true } }
      for (const listener of listeners.get('keydown') ?? []) listener(event)
      return event
    },
    get reloads() { return reloads }, get frames() { return frames },
  }
}

test('failed move preserves the current state and allows a successful retry', async () => {
  const app = await createApp()
  const { default: Player } = await app.load('../src/Player.js')
  const player = new Player({ mesh: {} })
  assert.equal(await player.setState('Ginga'), true)
  const currentState = player.currentState
  const oldState = player.oldState
  app.rejectAnimations()
  assert.equal(await player.setState('Ponteira'), false)
  assert.equal(player.currentState, currentState)
  assert.equal(player.oldState, oldState)
  assert.equal(player.loading, false)
  assert.equal(player.isReady, true)
  assert.ok(app.buttons.every(button => !button.disabled))
  assert.equal(player.actions.Ponteira, undefined)
  assert.equal(app.element('loading-error').hidden, false)
  app.allowAnimations()
  assert.equal(await player.setState('Ponteira'), true)
  assert.equal(player.currentState.name, 'Ponteira')
  assert.equal(app.element('loading-error').hidden, true)
  assert.equal(app.requests.filter(name => name === 'Ponteira').length, 2)
  assert.ok(app.buttons.every(button => button.disabled))
})

test('failed automatic move waits before retrying instead of requesting every frame', async () => {
  const app = await createApp()
  const { default: Player } = await app.load('../src/Player.js')
  const player = new Player({ mesh: {} })
  await player.setState('Ginga')
  app.element('random-moves').checked = true
  await player.update(4)
  app.advanceTime(4000)
  app.rejectAnimations()
  await player.update(3)
  await player.update(0.016)
  assert.deepEqual(app.requests, ['Ginga', 'Ponteira'])
  assert.equal(player.isReady, true)
})

test('random moves preserve the remaining interval across a long pause', async () => {
  const app = await createApp()
  const { default: Player } = await app.load('../src/Player.js')
  const player = new Player({ mesh: {} })
  await player.setState('Ginga')
  app.element('random-moves').checked = true
  app.advanceTime(4000)
  await player.update(4)
  app.advanceTime(10000)
  await player.update(0)
  await player.update(0)
  assert.deepEqual(app.requests, ['Ginga'])
  assert.equal(player.timeSinceLastMove, 4)
  await player.update(1.9)
  assert.deepEqual(app.requests, ['Ginga'])
  await player.update(0.2)
  assert.equal(player.currentState.name, 'Ponteira')
  assert.deepEqual(app.requests, ['Ginga', 'Ponteira'])
})

test('replay countdown freezes while paused and resets after the move', async () => {
  const app = await createApp()
  const { default: Player } = await app.load('../src/Player.js')
  const player = new Player({ mesh: {} })
  await player.setState('Ginga')
  await player.setState('Ponteira')
  await player.update(2)
  await player.setState('Ginga')
  assert.equal(player.timeSinceLastMove, 0)
  app.advanceTime(3100)
  await player.update(3.1)
  assert.equal(app.element('title').innerHTML, 3)
  app.advanceTime(10000)
  await player.update(0)
  assert.equal(app.element('title').innerHTML, 3)
  assert.equal(player.currentState.name, 'Ginga')
  await player.update(1)
  assert.equal(app.element('title').innerHTML, 2)
  await player.update(2)
  assert.equal(player.currentState.name, 'Ponteira')
})

test('automatic moves follow animation time at reduced speed', async () => {
  const app = await createApp()
  const { default: Player } = await app.load('../src/Player.js')
  const player = new Player({ mesh: {} })
  await player.setState('Ginga')
  app.element('random-moves').checked = true
  app.advanceTime(7000)
  await player.update(7 * 0.5)
  assert.deepEqual(app.requests, ['Ginga'])
  await player.update(5.2 * 0.5)
  assert.equal(player.currentState.name, 'Ponteira')
})

for (const arrow of ['ArrowLeft', 'ArrowRight']) {
  test(`${arrow} focuses speed and leaves native arrow handling available`, async () => {
    const app = await createApp()
    await app.load('../src/main.js')
    const speed = app.element('speed')
    assert.equal(app.keydown('ArrowUp').defaultPrevented, false)
    assert.equal(speed.focusCalls, 0)
    assert.equal(app.keydown(arrow).defaultPrevented, false)
    assert.equal(speed.focusCalls, 1)
    assert.equal(app.keydown('ArrowLeft').defaultPrevented, false)
    assert.equal(app.keydown('ArrowRight').defaultPrevented, false)
    assert.equal(speed.focusCalls, 1)
  })
}

test('clicks work when screen wake lock is unsupported', async () => {
  const app = await createApp()
  await app.load('../src/main.js')
  await app.click()
  assert.equal(app.element('loading-error').hidden, true)
  assert.equal(app.element('preloader').style.display, 'none')
})

test('concurrent clicks request one wake lock and reuse it until released', async () => {
  let requests = 0
  let resolveRequest
  const sentinel = { released: false }
  const app = await createApp({ wakeLock: {
    request(type) {
      assert.equal(type, 'screen')
      requests++
      return new Promise(resolve => { resolveRequest = resolve })
    },
  } })
  await app.load('../src/main.js')
  const firstClick = app.click()
  await app.click()
  assert.equal(requests, 1)
  resolveRequest(sentinel)
  await firstClick
  await app.click()
  assert.equal(requests, 1)
  sentinel.released = true
  const nextClick = app.click()
  assert.equal(requests, 2)
  resolveRequest({ released: false })
  await nextClick
  await app.click()
  assert.equal(requests, 2)
})

for (const failure of ['throw', 'reject']) {
  test(`wake lock ${failure} is handled and a later click can retry`, async () => {
    let requests = 0
    const app = await createApp({ wakeLock: {
      request() {
        requests++
        if (requests === 1) {
          const error = new Error('Wake lock denied')
          if (failure === 'throw') throw error
          return Promise.reject(error)
        }
        return Promise.resolve({ released: false })
      },
    } })
    await app.load('../src/main.js')
    await app.click()
    assert.equal(app.element('loading-error').hidden, true)
    await app.click()
    await app.click()
    assert.equal(requests, 2)
  })
}

for (const failure of ['model', 'animation']) {
  test(`initial ${failure} failure hides the spinner and offers a retry`, async () => {
    const app = await createApp({ failModel: failure === 'model', failAnimation: failure === 'animation' })
    await app.load('../src/main.js')
    assert.equal(app.element('preloader').style.display, 'none')
    assert.equal(app.element('loading-error').hidden, false)
    assert.equal(app.element('retry-loading').hidden, false)
    assert.ok(app.buttons.every(button => button.disabled))
    assert.equal(app.frames, 0)
    app.element('retry-loading').onclick()
    assert.equal(app.reloads, 1)
  })
}
