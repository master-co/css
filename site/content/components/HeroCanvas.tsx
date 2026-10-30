'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { heroClothSource, heroCompositeSource, heroCopySource, heroPlaneScale, heroVertexSource } from './hero-shaders'
import { rasterizeHeroTitle, type HeroTitleMask } from './hero-title-mask'

const renderScale = 0.6
const introDuration = 2200
const materialDuration = 800
const glintDelay = 260
const glintDuration = 1700
const compositePixelBudget = 3_000_000
const backgroundPixelBudget = 1_500_000
const litSelector = '.home-hero-pill, .home-hero-actions > *'
const litProperties = ['--lit-x', '--lit-y', '--lit-angle', '--cast-x', '--cast-y', '--lit-near']

type Bounds = [number, number, number, number]

interface LitControl {
  element: HTMLElement
  left: number
  top: number
  width: number
  height: number
  values: string[]
}

/** Matte gold and a cut-stone title share one lamp; controls read the same lamp through CSS properties. */
export default function HeroCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [generation, setGeneration] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.closest<HTMLElement>('[data-glyph-host]')
    const title = host?.querySelector<HTMLElement>('[data-glass-title]')
    const readingArea = host?.querySelector<HTMLElement>('.home-hero-actions')
    if (!canvas || !host || !title) return
    const header = document.querySelector<HTMLElement>('.home-header')
    const body = host.querySelector<HTMLElement>('.home-hero-body')
    let gl: WebGLRenderingContext | null = null
    try {
      gl = canvas.getContext('webgl', { antialias: false, depth: false, stencil: false })
    } catch {
      // A readable DOM composition is already present when WebGL is unavailable.
    }
    if (!gl) { canvas.hidden = true; return }
    const context = gl
    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
    if (!probe) { canvas.hidden = true; return }
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const contrast = matchMedia('(forced-colors: active)')
    const print = matchMedia('print')
    const scheme = matchMedia('(prefers-color-scheme: dark)')
    const programs: WebGLProgram[] = []
    const shaders: WebGLShader[] = []
    const textures: WebGLTexture[] = []
    const buffers: WebGLBuffer[] = []
    const framebuffers: WebGLFramebuffer[] = []
    let contextLost = false
    let released = false
    const clearReady = () => {
      host.removeAttribute('data-glass-ready')
    }
    const release = () => {
      // Restoration invalidates old handles; the driver has already reclaimed these resources.
      if (contextLost || released) return
      released = true
      programs.forEach((item) => context.deleteProgram(item))
      shaders.forEach((item) => context.deleteShader(item))
      textures.forEach((item) => context.deleteTexture(item))
      buffers.forEach((item) => context.deleteBuffer(item))
      framebuffers.forEach((item) => context.deleteFramebuffer(item))
    }
    const program = (source: string, names: string[]) => {
      const result = context.createProgram()
      if (!result) throw new Error('Cannot allocate a hero program')
      programs.push(result)
      for (const [type, sourceText] of [[context.VERTEX_SHADER, heroVertexSource], [context.FRAGMENT_SHADER, source]] as const) {
        const shader = context.createShader(type)
        if (!shader) throw new Error('Cannot allocate a hero shader')
        shaders.push(shader)
        context.shaderSource(shader, sourceText)
        context.compileShader(shader)
        if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) throw new Error('Cannot compile a hero shader')
        context.attachShader(result, shader)
      }
      context.bindAttribLocation(result, 0, 'position')
      context.linkProgram(result)
      if (!context.getProgramParameter(result, context.LINK_STATUS)) throw new Error('Cannot link a hero program')
      return { program: result, uniforms: Object.fromEntries(names.map((name) => [name, context.getUniformLocation(result, name)])) }
    }
    const texture = (unit: number) => {
      const result = context.createTexture()
      if (!result) throw new Error('Cannot allocate a hero texture')
      textures.push(result)
      context.activeTexture(context.TEXTURE0 + unit)
      context.bindTexture(context.TEXTURE_2D, result)
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR)
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR)
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE)
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE)
      context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, 1, 1, 0, context.RGBA, context.UNSIGNED_BYTE, new Uint8Array(4))
      return result
    }
    let cloth: ReturnType<typeof program>
    let composite: ReturnType<typeof program>
    let copy: ReturnType<typeof program>
    let scene: WebGLTexture
    let glyphs: WebGLTexture
    let target: WebGLFramebuffer
    try {
      cloth = program(heroClothSource, ['resolution', 'time', 'intro', 'pointer', 'lamp', 'shadow', 'body', 'sheen', 'ground', 'title', 'readingArea', 'fontSize'])
      composite = program(heroCompositeSource, ['resolution', 'title', 'fontSize', 'distanceRange', 'material', 'glint', 'time', 'lamp', 'ink', 'ground', 'scene', 'glyphs'])
      copy = program(heroCopySource, ['scene', 'glyphs', 'resolution', 'time', 'ground', 'title', 'fontSize', 'distanceRange', 'lamp', 'shade'])
      const buffer = context.createBuffer()
      if (!buffer) throw new Error('Cannot allocate a hero triangle')
      buffers.push(buffer)
      context.bindBuffer(context.ARRAY_BUFFER, buffer)
      context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), context.STATIC_DRAW)
      context.enableVertexAttribArray(0)
      context.vertexAttribPointer(0, 2, context.FLOAT, false, 0, 0)
      scene = texture(0)
      glyphs = texture(1)
      const framebuffer = context.createFramebuffer()
      if (!framebuffer) throw new Error('Cannot allocate a hero background')
      target = framebuffer
      framebuffers.push(target)
      context.bindFramebuffer(context.FRAMEBUFFER, target)
      context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, scene, 0)
      context.bindFramebuffer(context.FRAMEBUFFER, null)
    } catch {
      canvas.hidden = true
      release()
      return
    }

    let disposed = false
    let failed = false
    let visible = true
    let fontsReady = false
    let dirty = true
    let frame = 0
    let width = 1
    let height = 1
    let sceneWidth = 0
    let sceneHeight = 0
    let startedAt = -1
    let materialAt = -1
    let previousFrame = -1
    let sceneTime = 8
    let scissor: Bounds = [0, 0, 0, 0]
    let mask: HeroTitleMask | null = null
    let maskKey = ''
    let fontFace: FontFace | undefined
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, targetStrength: 0 }
    // The lamp rests above the title's left half and drifts; a mouse picks it up and carries it lower.
    const lamp = { x: 0, y: 0, z: 0, targetX: 0, targetY: 0, held: false, placed: false }
    const rest = { x: 0, y: 0, z: 1, sway: 0, fontSize: 1 }
    let lit: LitControl[] = []
    const maximumTexture = context.getParameter(context.MAX_TEXTURE_SIZE) as number
    const maximumViewport = context.getParameter(context.MAX_VIEWPORT_DIMS) as Int32Array
    const maximumSurface = Math.min(maximumTexture, maximumViewport[0], maximumViewport[1])
    const fallback = () => {
      failed = true
      unlight()
      cancelAnimationFrame(frame)
      frame = 0
      clearReady()
      canvas.hidden = true
      release()
    }
    const channels = (color: string) => {
      probe.clearRect(0, 0, 1, 1)
      probe.fillStyle = '#000'
      probe.fillStyle = color
      probe.fillRect(0, 0, 1, 1)
      const [red, green, blue] = probe.getImageData(0, 0, 1, 1).data
      return [red / 255, green / 255, blue / 255] as const
    }
    const clip = (bounds: Bounds, padding = 0): Bounds => {
      const left = Math.max(0, Math.floor((bounds[0] - padding) * canvas.width / width))
      const bottom = Math.max(0, Math.floor((height - bounds[1] - bounds[3] - padding) * canvas.height / height))
      const right = Math.min(canvas.width, Math.ceil((bounds[0] + bounds[2] + padding) * canvas.width / width))
      const top = Math.min(canvas.height, Math.ceil((height - bounds[1] + padding) * canvas.height / height))
      return [left, bottom, Math.max(0, right - left), Math.max(0, top - bottom)]
    }
    const layout = () => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return false
      width = rect.width
      height = rect.height
      const maskRatio = Math.min(devicePixelRatio || 1, 2, maximumTexture / (Math.max(width, height) + 16))
      const ratio = Math.min(maskRatio, Math.sqrt(compositePixelBudget / (width * height)), maximumSurface / Math.max(width, height))
      const pixelWidth = Math.max(1, Math.floor(width * ratio))
      const pixelHeight = Math.max(1, Math.floor(height * ratio))
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }
      const backgroundRatio = Math.min(maskRatio * renderScale, Math.sqrt(backgroundPixelBudget / (width * height)))
      const backgroundWidth = Math.max(1, Math.floor(width * backgroundRatio))
      const backgroundHeight = Math.max(1, Math.floor(height * backgroundRatio))
      if (sceneWidth !== backgroundWidth || sceneHeight !== backgroundHeight) {
        sceneWidth = backgroundWidth
        sceneHeight = backgroundHeight
        context.activeTexture(context.TEXTURE0)
        context.bindTexture(context.TEXTURE_2D, scene)
        context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, sceneWidth, sceneHeight, 0, context.RGBA, context.UNSIGNED_BYTE, null)
        context.bindFramebuffer(context.FRAMEBUFFER, target)
        if (context.checkFramebufferStatus(context.FRAMEBUFFER) !== context.FRAMEBUFFER_COMPLETE) throw new Error('Incomplete hero background')
        context.bindFramebuffer(context.FRAMEBUFFER, null)
      }
      const titleStyle = getComputedStyle(title)
      const titleRect = title.getBoundingClientRect()
      const key = [title.textContent, titleStyle.font, titleStyle.letterSpacing, titleStyle.fontFeatureSettings, titleStyle.lineHeight, titleRect.x - rect.x, titleRect.y - rect.y, titleRect.width, titleRect.height, maskRatio, document.documentElement.lang].join('|')
      if (fontsReady && key !== maskKey) {
        mask = rasterizeHeroTitle(title, canvas, maskRatio, titleStyle.fontFamily.replace(/\bGeist\b/, 'Home Hero Geist'))
        maskKey = key
        context.activeTexture(context.TEXTURE1)
        context.bindTexture(context.TEXTURE_2D, glyphs)
        if (mask) {
          context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, mask.width, mask.height, 0, context.RGBA, context.UNSIGNED_BYTE, mask.pixels)
        } else {
          host.removeAttribute('data-glass-ready')
        }
      }
      const bounds: Bounds = mask ? [mask.left, mask.top, mask.cssWidth, mask.cssHeight] : [titleRect.left - rect.left, titleRect.top - rect.top, titleRect.width, titleRect.height]
      scissor = clip(bounds)
      const style = getComputedStyle(canvas)
      const ground = channels(getComputedStyle(host).backgroundColor)
      for (const renderer of [cloth, composite, copy]) {
        context.useProgram(renderer.program)
        context.uniform2f(renderer.uniforms.resolution, width, height)
        if ('ground' in renderer.uniforms) context.uniform3f(renderer.uniforms.ground, ...ground)
        if ('scene' in renderer.uniforms) context.uniform1i(renderer.uniforms.scene, 0)
      }
      const fontSize = mask?.fontSize ?? parseFloat(titleStyle.fontSize)
      for (const renderer of [cloth, composite, copy]) {
        context.useProgram(renderer.program)
        context.uniform4f(renderer.uniforms.title, ...bounds)
        context.uniform1f(renderer.uniforms.fontSize, fontSize)
      }
      context.useProgram(copy.program)
      context.uniform1i(copy.uniforms.glyphs, 1)
      context.uniform1f(copy.uniforms.distanceRange, mask?.range ?? 1)
      const groundLight = ground[0] * 0.2126 + ground[1] * 0.7152 + ground[2] * 0.0722
      // Obsidian casts a clear shadow on champagne silk; on dark silk it only separates the moonstone.
      context.uniform1f(copy.uniforms.shade, mask ? (groundLight > 0.4 ? 1 : 0.45) : 0)
      rest.x = titleRect.left - rect.left + titleRect.width * 0.3
      rest.y = titleRect.top - rect.top - fontSize * 0.8
      rest.z = fontSize * 5
      rest.sway = titleRect.width * 0.2
      rest.fontSize = fontSize
      lit = Array.from(host.querySelectorAll<HTMLElement>(litSelector), (element) => {
        const box = element.getBoundingClientRect()
        return { element, left: box.left - rect.left, top: box.top - rect.top, width: box.width, height: box.height, values: [] }
      })
      context.useProgram(cloth.program)
      const readingRect = readingArea?.getBoundingClientRect()
      context.uniform4f(cloth.uniforms.readingArea, (readingRect?.left ?? rect.left) - rect.left, (readingRect?.top ?? rect.top) - rect.top, readingRect?.width ?? 0, readingRect?.height ?? 0)
      context.uniform3f(cloth.uniforms.shadow, ...channels(style.color))
      context.uniform3f(cloth.uniforms.body, ...channels(style.caretColor))
      context.uniform3f(cloth.uniforms.sheen, ...channels(style.outlineColor))
      context.useProgram(composite.program)
      context.uniform1f(composite.uniforms.distanceRange, mask?.range ?? 1)
      context.uniform3f(composite.uniforms.ink, ...channels(titleStyle.color))
      context.uniform1i(composite.uniforms.glyphs, 1)
      return true
    }
    const canDraw = () => !disposed && !failed && visible && !document.hidden && !contrast.matches && !print.matches
    const schedule = () => {
      if (!frame && canDraw()) frame = requestAnimationFrame(tick)
    }
    const invalidate = () => { dirty = true; schedule() }
    const tick = (time: number) => {
      frame = 0
      if (!canDraw()) return
      try {
        if (dirty) {
          if (!layout()) return
          dirty = false
        }
        if (startedAt < 0) startedAt = time
        if (mask && materialAt < 0) materialAt = time
        const reduced = motion.matches
        const delta = previousFrame < 0 ? 0 : Math.min(64, time - previousFrame)
        previousFrame = time
        if (!reduced) sceneTime += delta / 1000
        const follow = 1 - Math.exp(-delta / 180)
        pointer.x += (pointer.targetX - pointer.x) * follow
        pointer.y += (pointer.targetY - pointer.y) * follow
        pointer.strength += ((reduced ? 0 : pointer.targetStrength) - pointer.strength) * (1 - Math.exp(-delta / 260))
        const sceneClock = sceneTime
        const opened = reduced ? 1 : Math.min(1, (time - startedAt) / introDuration)
        const formed = reduced ? 1 : Math.max(0, Math.min(1, (time - materialAt) / materialDuration))
        const material = 1 - Math.pow(1 - formed, 3)
        const glint = reduced || materialAt < 0 ? 1 : Math.max(0, Math.min(1, (time - materialAt - glintDelay) / glintDuration))
        if (!lamp.held) {
          lamp.targetX = rest.x + Math.sin(sceneClock * 0.19) * rest.sway
          lamp.targetY = rest.y + Math.cos(sceneClock * 0.15) * rest.fontSize * 0.3
        }
        const targetZ = lamp.held ? rest.fontSize * 3.2 : rest.z
        const carry = lamp.placed ? 1 - Math.exp(-delta / 120) : 1
        lamp.x += (lamp.targetX - lamp.x) * carry
        lamp.y += (lamp.targetY - lamp.y) * carry
        lamp.z += (targetZ - lamp.z) * carry
        lamp.placed = true
        illuminate()
        context.bindFramebuffer(context.FRAMEBUFFER, target)
        context.viewport(0, 0, sceneWidth, sceneHeight)
        context.useProgram(cloth.program)
        context.uniform1f(cloth.uniforms.time, sceneClock)
        context.uniform1f(cloth.uniforms.intro, 1 - Math.pow(1 - opened, 3))
        context.uniform3f(cloth.uniforms.pointer, pointer.x, pointer.y, reduced ? 0 : pointer.strength)
        context.uniform3f(cloth.uniforms.lamp, lamp.x, lamp.y, lamp.z)
        context.drawArrays(context.TRIANGLES, 0, 3)
        context.bindFramebuffer(context.FRAMEBUFFER, null)
        context.viewport(0, 0, canvas.width, canvas.height)
        context.useProgram(copy.program)
        context.uniform1f(copy.uniforms.time, sceneClock)
        context.uniform3f(copy.uniforms.lamp, lamp.x, lamp.y, lamp.z)
        context.drawArrays(context.TRIANGLES, 0, 3)
        context.enable(context.SCISSOR_TEST)
        context.enable(context.BLEND)
        context.blendFuncSeparate(context.SRC_ALPHA, context.ONE_MINUS_SRC_ALPHA, context.ONE, context.ONE_MINUS_SRC_ALPHA)
        if (mask) {
          context.useProgram(composite.program)
          context.uniform1f(composite.uniforms.time, sceneClock)
          context.uniform3f(composite.uniforms.lamp, lamp.x, lamp.y, lamp.z)
          context.uniform1f(composite.uniforms.material, material)
          context.uniform1f(composite.uniforms.glint, glint)
          context.scissor(...scissor)
          context.drawArrays(context.TRIANGLES, 0, 3)
        }
        context.disable(context.SCISSOR_TEST)
        context.disable(context.BLEND)
        if (mask && !host.hasAttribute('data-glass-ready')) {
          if (context.getError() !== context.NO_ERROR) throw new Error('Cannot draw hero glass')
          if (mask) host.setAttribute('data-glass-ready', '')
        }
        if (!reduced) schedule()
      } catch {
        if (!disposed) fallback()
      }
    }
    // Native controls read the lamp as a highlight position, a rim angle and a cast-shadow offset.
    const illuminate = () => {
      for (const control of lit) {
        const centerX = control.left + control.width / 2
        const centerY = control.top + control.height / 2
        const elevation = 6
        const scale = elevation / Math.max(lamp.z - elevation, 1)
        const castX = Math.max(-10, Math.min(10, (centerX - lamp.x) * scale))
        const castY = Math.max(-10, Math.min(10, (centerY - lamp.y) * scale))
        const near = Math.exp(-(((lamp.x - centerX) / (control.width * 0.9)) ** 2 + ((lamp.y - centerY) / (control.height * 2.4)) ** 2))
        // Rounded to what the eye can tell apart, so a drifting lamp restyles the controls only now and then.
        const values = [
          `${Math.round(Math.max(-60, Math.min(160, (lamp.x - control.left) / control.width * 100)))}%`,
          `${Math.round(Math.max(-160, Math.min(260, (lamp.y - control.top) / control.height * 100)))}%`,
          `${Math.round(Math.atan2(lamp.x - centerX, centerY - lamp.y) * 180 / Math.PI)}deg`,
          `${castX.toFixed(1)}px`,
          `${castY.toFixed(1)}px`,
          (lamp.held ? near : near * 0.4).toFixed(2)
        ]
        litProperties.forEach((name, index) => {
          if (values[index] !== control.values[index]) control.element.style.setProperty(name, values[index])
        })
        control.values = values
      }
    }
    const unlight = () => {
      for (const control of lit) litProperties.forEach((name) => control.element.style.removeProperty(name))
    }
    const activity = () => {
      cancelAnimationFrame(frame)
      frame = 0
      previousFrame = -1
      canvas.hidden = failed || contrast.matches || print.matches
      if (contrast.matches || print.matches) clearReady()
      dirty = true
      schedule()
    }
    const move = (event: PointerEvent) => {
      if (motion.matches || event.pointerType !== 'mouse') return
      const rect = canvas.getBoundingClientRect()
      pointer.targetX = ((event.clientX - rect.left) / width - 0.5) * width / height * heroPlaneScale
      pointer.targetY = (0.5 - (event.clientY - rect.top) / height) * heroPlaneScale
      pointer.targetStrength = 1
      lamp.targetX = event.clientX - rect.left
      lamp.targetY = event.clientY - rect.top
      lamp.held = true
    }
    const leave = () => { pointer.targetStrength = 0; lamp.held = false }
    const lost = (event: Event) => { event.preventDefault(); contextLost = true; fallback() }
    const restored = () => { setGeneration((value) => value + 1) }
    const resize = new ResizeObserver(invalidate)
    resize.observe(canvas)
    resize.observe(title)
    if (readingArea) resize.observe(readingArea)
    if (body) resize.observe(body)
    const theme = new MutationObserver(invalidate)
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style', 'lang'] })
    const text = new MutationObserver(invalidate)
    text.observe(title, { childList: true, characterData: true, subtree: true })
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; activity() })
    intersection.observe(host)
    document.addEventListener('visibilitychange', activity)
    document.fonts.addEventListener('loadingdone', invalidate)
    window.addEventListener('resize', invalidate)
    motion.addEventListener('change', activity)
    contrast.addEventListener('change', activity)
    print.addEventListener('change', activity)
    scheme.addEventListener('change', invalidate)
    host.addEventListener('pointermove', move)
    host.addEventListener('pointerleave', leave)
    header?.addEventListener('pointermove', move)
    header?.addEventListener('pointerleave', leave)
    canvas.addEventListener('webglcontextlost', lost)
    canvas.addEventListener('webglcontextrestored', restored)
    activity()
    const prepareFont = async () => {
      try {
        // Canvas lacks font-feature-settings; retain the site's Geist stylistic sets in a private face.
        fontFace = new FontFace('Home Hero Geist', 'url("/fonts/GeistVariable.woff2")', { weight: '100 900', featureSettings: getComputedStyle(title).fontFeatureSettings })
        await fontFace.load()
        if (disposed) return
        document.fonts.add(fontFace)
        const style = getComputedStyle(title)
        await document.fonts.load(`${style.fontWeight} ${style.fontSize} ${style.fontFamily.replace(/\bGeist\b/, 'Home Hero Geist')}`, title.textContent ?? '')
        await document.fonts.ready
        if (disposed) return
        fontsReady = true
        invalidate()
      } catch {
        if (!disposed) fallback()
      }
    }
    void prepareFont()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      clearReady()
      unlight()
      resize.disconnect()
      theme.disconnect()
      text.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', activity)
      document.fonts.removeEventListener('loadingdone', invalidate)
      window.removeEventListener('resize', invalidate)
      motion.removeEventListener('change', activity)
      contrast.removeEventListener('change', activity)
      print.removeEventListener('change', activity)
      scheme.removeEventListener('change', invalidate)
      host.removeEventListener('pointermove', move)
      host.removeEventListener('pointerleave', leave)
      header?.removeEventListener('pointermove', move)
      header?.removeEventListener('pointerleave', leave)
      canvas.removeEventListener('webglcontextlost', lost)
      canvas.removeEventListener('webglcontextrestored', restored)
      if (fontFace) document.fonts.delete(fontFace)
      release()
    }
  }, [generation])

  return <canvas aria-hidden="true" className={clsx('home-hero-canvas', className)} ref={canvasRef} />
}
