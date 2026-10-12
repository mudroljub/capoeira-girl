import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'

async function createApp({ failModel = false, failAnimation = false } = {}) {
  const elements = new Map()
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      hidden: true, style: {}, checked: false, value: '100',
      addEventListener() {}, focus() {},
    })
    return elements.get(id)
  }
  const buttons = ['Ginga', 'Ponteira'].map(innerText => ({
    innerText, style: {}, disabled: false, addEventListener() {},
  }))
  const requests = []
  let reloads = 0
  let frames = 0
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
    console: { error() {} },
    document: {
      getElementById: element,
      querySelectorAll: selector => selector === '.special' ? [buttons[1]]
        : selector === '.tab input' ? [] : buttons,
      addEventListener() {},
    },
    window: { location: { reload() { reloads++ } } },
    navigator: {},
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
  player.lastAnimTime = Date.now() - 7000
  app.rejectAnimations()
  await player.update(0.016)
  await player.update(0.016)
  assert.deepEqual(app.requests, ['Ginga', 'Ponteira'])
  assert.equal(player.isReady, true)
})

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
