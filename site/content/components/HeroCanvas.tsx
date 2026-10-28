'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { heroClothSource, heroCompositeSource, heroCopySource, heroPlaneScale, heroVertexSource } from './hero-shaders'
import { rasterizeHeroTitle } from './hero-title-mask'

const renderScale = 0.6
const introDuration = 2400
const materialDuration = 640
/** Keep large retina surfaces within a measured fill budget; glyph masks retain up to 2x density. */
const compositePixelBudget = 3_000_000

/** One shared scene for the silk and its reflection through the title; the DOM owns all layout. */
export default function HeroCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [generation, setGeneration] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.closest<HTMLElement>('[data-glyph-host]')
    const title = host?.querySelector<HTMLElement>('[data-glass-title]')
    if (!canvas || !host || !title) return
    canvas.hidden = false
    let gl: WebGLRenderingContext | null = null
    try {
      gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false })
    } catch {
      // The live heading is already the fallback when a browser refuses a WebGL context.
    }
    if (!gl) return
    const context = gl
    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
    if (!probe) return
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const contrast = matchMedia('(forced-colors: active)')
    const scheme = matchMedia('(prefers-color-scheme: dark)')
    const programs: WebGLProgram[] = []
    const shaders: WebGLShader[] = []
    const textures: WebGLTexture[] = []
    const buffers: WebGLBuffer[] = []
    const framebuffers: WebGLFramebuffer[] = []
    let contextLost = false
    const release = () => {
      // Restoring a context invalidates its old handles. The driver has already reclaimed them;
      // deleting those handles after restoration would leave INVALID_OPERATION on the new scene.
      if (contextLost) return
      programs.forEach((program) => context.deleteProgram(program))
      shaders.forEach((shader) => context.deleteShader(shader))
      textures.forEach((texture) => context.deleteTexture(texture))
      buffers.forEach((buffer) => context.deleteBuffer(buffer))
      framebuffers.forEach((buffer) => context.deleteFramebuffer(buffer))
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
      cloth = program(heroClothSource, ['resolution', 'time', 'intro', 'rise', 'pointer', 'ring', 'shadow', 'body', 'sheen', 'ground', 'title', 'fontSize'])
      composite = program(heroCompositeSource, ['resolution', 'title', 'fontSize', 'distanceRange', 'material', 'pointer', 'ink', 'ground', 'scene', 'glyphs'])
      copy = program(heroCopySource, ['scene'])
      context.useProgram(copy.program)
      context.uniform1i(copy.uniforms.scene, 0)
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
    let ringAt = -1
    let hasMask = false
    let scissor = [0, 0, 0, 0]
    let fontFace: FontFace | undefined
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, targetStrength: 0 }
    const ring = { x: 0, y: 0 }
    const maximumTexture = context.getParameter(context.MAX_TEXTURE_SIZE) as number
    const fallback = () => {
      failed = true
      cancelAnimationFrame(frame)
      frame = 0
      host.removeAttribute('data-glass-ready')
      canvas.hidden = true
    }
    const channels = (color: string) => {
      probe.clearRect(0, 0, 1, 1)
      probe.fillStyle = '#000'
      probe.fillStyle = color
      probe.fillRect(0, 0, 1, 1)
      const [red, green, blue] = probe.getImageData(0, 0, 1, 1).data
      return [red / 255, green / 255, blue / 255] as const
    }
    const layout = () => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return false
      width = rect.width
      height = rect.height
      const maskRatio = Math.min(devicePixelRatio || 1, 2, maximumTexture / (Math.max(width, height) + 16))
      const ratio = Math.min(maskRatio, Math.max(1, Math.sqrt(compositePixelBudget / (width * height))))
      const pixelWidth = Math.max(1, Math.floor(width * ratio))
      const pixelHeight = Math.max(1, Math.floor(height * ratio))
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }
      const backgroundWidth = Math.max(1, Math.round(width * maskRatio * renderScale))
      const backgroundHeight = Math.max(1, Math.round(height * maskRatio * renderScale))
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
      const mask = fontsReady ? rasterizeHeroTitle(title, canvas, maskRatio, titleStyle.fontFamily.replace(/\bGeist\b/, 'Home Hero Geist')) : null
      const titleRect = title.getBoundingClientRect()
      const bounds = mask ? [mask.left, mask.top, mask.cssWidth, mask.cssHeight] : [titleRect.left - rect.left, titleRect.top - rect.top, titleRect.width, titleRect.height]
      const left = Math.max(0, Math.floor(bounds[0] * canvas.width / width))
      const bottom = Math.max(0, Math.floor((height - bounds[1] - bounds[3]) * canvas.height / height))
      const right = Math.min(canvas.width, Math.ceil((bounds[0] + bounds[2]) * canvas.width / width))
      const top = Math.min(canvas.height, Math.ceil((height - bounds[1]) * canvas.height / height))
      scissor = [left, bottom, Math.max(0, right - left), Math.max(0, top - bottom)]
      hasMask = !!mask
      if (mask) {
        context.activeTexture(context.TEXTURE1)
        context.bindTexture(context.TEXTURE_2D, glyphs)
        context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, mask.width, mask.height, 0, context.RGBA, context.UNSIGNED_BYTE, mask.pixels)
      } else {
        host.removeAttribute('data-glass-ready')
        context.activeTexture(context.TEXTURE1)
        context.bindTexture(context.TEXTURE_2D, glyphs)
        context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, 1, 1, 0, context.RGBA, context.UNSIGNED_BYTE, new Uint8Array(4))
      }
      const style = getComputedStyle(canvas)
      const ground = channels(getComputedStyle(host).backgroundColor)
      for (const renderer of [cloth, composite]) {
        context.useProgram(renderer.program)
        context.uniform2f(renderer.uniforms.resolution, width, height)
        context.uniform4f(renderer.uniforms.title, bounds[0], bounds[1], bounds[2], bounds[3])
        context.uniform1f(renderer.uniforms.fontSize, mask?.fontSize ?? parseFloat(titleStyle.fontSize))
        context.uniform3f(renderer.uniforms.ground, ...ground)
      }
      context.useProgram(cloth.program)
      context.uniform1f(cloth.uniforms.rise, width < 640 ? 0.26 : 0.4)
      context.uniform3f(cloth.uniforms.shadow, ...channels(style.color))
      context.uniform3f(cloth.uniforms.body, ...channels(style.caretColor))
      context.uniform3f(cloth.uniforms.sheen, ...channels(style.outlineColor))
      context.useProgram(composite.program)
      context.uniform1f(composite.uniforms.distanceRange, mask?.range ?? 1)
      context.uniform3f(composite.uniforms.ink, ...channels(titleStyle.color))
      context.uniform1i(composite.uniforms.scene, 0)
      context.uniform1i(composite.uniforms.glyphs, 1)
      return true
    }
    const canDraw = () => !disposed && !failed && visible && !document.hidden && !contrast.matches
    const schedule = () => {
      if (!frame && canDraw()) frame = requestAnimationFrame(tick)
    }
    const invalidate = () => {
      dirty = true
      schedule()
    }
    const tick = (time: number) => {
      frame = 0
      if (!canDraw()) return
      try {
        if (dirty) {
          if (!layout()) return
          dirty = false
        }
        if (startedAt < 0) startedAt = time
        if (hasMask && materialAt < 0) materialAt = time
        const reduced = motion.matches
        pointer.x += (pointer.targetX - pointer.x) * 0.06
        pointer.y += (pointer.targetY - pointer.y) * 0.06
        pointer.strength += ((reduced ? 0 : pointer.targetStrength) - pointer.strength) * 0.04
        const opened = reduced ? 1 : Math.min(1, (time - startedAt) / introDuration)
        const formed = reduced ? 1 : Math.max(0, Math.min(1, (time - materialAt) / materialDuration))
        context.bindFramebuffer(context.FRAMEBUFFER, target)
        context.viewport(0, 0, sceneWidth, sceneHeight)
        context.useProgram(cloth.program)
        context.uniform1f(cloth.uniforms.time, reduced ? 8 : (time + Math.min(window.scrollY, height) * 6) / 1000)
        context.uniform1f(cloth.uniforms.intro, 1 - Math.pow(1 - opened, 3))
        context.uniform3f(cloth.uniforms.pointer, pointer.x, pointer.y, reduced ? 0 : pointer.strength)
        context.uniform3f(cloth.uniforms.ring, ring.x, ring.y, reduced || ringAt < 0 ? -1 : (time - ringAt) / 1000)
        if (ringAt >= 0 && time - ringAt > 2400) ringAt = -1
        context.drawArrays(context.TRIANGLES, 0, 3)
        context.bindFramebuffer(context.FRAMEBUFFER, null)
        context.viewport(0, 0, canvas.width, canvas.height)
        context.useProgram(copy.program)
        context.drawArrays(context.TRIANGLES, 0, 3)
        if (hasMask) {
          context.useProgram(composite.program)
          context.uniform3f(composite.uniforms.pointer, pointer.x, pointer.y, reduced ? 0 : pointer.strength)
          context.uniform1f(composite.uniforms.material, 1 - Math.pow(1 - formed, 3))
          context.enable(context.SCISSOR_TEST)
          context.scissor(scissor[0], scissor[1], scissor[2], scissor[3])
          context.drawArrays(context.TRIANGLES, 0, 3)
          context.disable(context.SCISSOR_TEST)
        }
        if (hasMask && !host.hasAttribute('data-glass-ready')) {
          if (context.getError() !== context.NO_ERROR) throw new Error('Cannot draw the hero title')
          host.setAttribute('data-glass-ready', '')
        }
        if (!reduced) schedule()
      } catch {
        if (!disposed) fallback()
      }
    }
    const activity = () => {
      cancelAnimationFrame(frame)
      frame = 0
      schedule()
    }
    const toPlane = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: ((event.clientX - rect.left) / width - 0.5) * width / height * heroPlaneScale,
        y: (0.5 - (event.clientY - rect.top) / height) * heroPlaneScale
      }
    }
    const move = (event: PointerEvent) => {
      if (motion.matches || event.pointerType !== 'mouse') return
      const point = toPlane(event)
      pointer.targetX = point.x
      pointer.targetY = point.y
      pointer.targetStrength = 1
    }
    const leave = () => { pointer.targetStrength = 0 }
    const press = (event: PointerEvent) => {
      if (motion.matches) return
      Object.assign(ring, toPlane(event))
      ringAt = performance.now()
    }
    const lost = (event: Event) => {
      event.preventDefault()
      contextLost = true
      fallback()
    }
    const restored = () => { setGeneration((value) => value + 1) }
    const resize = new ResizeObserver(invalidate)
    resize.observe(canvas)
    resize.observe(title)
    const body = host.querySelector('.home-hero-body')
    if (body) resize.observe(body)
    const theme = new MutationObserver(invalidate)
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style', 'lang'] })
    const text = new MutationObserver(invalidate)
    text.observe(title, { childList: true, characterData: true, subtree: true })
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      activity()
    })
    intersection.observe(host)
    document.addEventListener('visibilitychange', activity)
    document.fonts.addEventListener('loadingdone', invalidate)
    window.addEventListener('resize', invalidate)
    motion.addEventListener('change', activity)
    contrast.addEventListener('change', activity)
    scheme.addEventListener('change', invalidate)
    host.addEventListener('pointermove', move)
    host.addEventListener('pointerleave', leave)
    host.addEventListener('pointerdown', press)
    canvas.addEventListener('webglcontextlost', lost)
    canvas.addEventListener('webglcontextrestored', restored)
    schedule()
    // Canvas has no font-feature-settings property. A private face descriptor preserves Geist's
    // site stylistic sets while the real heading continues to use its original fallback stack.
    const prepareFont = async () => {
      try {
        fontFace = new FontFace('Home Hero Geist', 'url("/fonts/GeistVariable.woff2")', {
          weight: '100 900', featureSettings: getComputedStyle(title).fontFeatureSettings
        })
        await fontFace.load()
        if (disposed) return
        document.fonts.add(fontFace)
        const style = getComputedStyle(title)
        // Resolve the complete headline, including its CJK fallback, before measuring either face.
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
      host.removeAttribute('data-glass-ready')
      resize.disconnect()
      theme.disconnect()
      text.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', activity)
      document.fonts.removeEventListener('loadingdone', invalidate)
      window.removeEventListener('resize', invalidate)
      motion.removeEventListener('change', activity)
      contrast.removeEventListener('change', activity)
      scheme.removeEventListener('change', invalidate)
      host.removeEventListener('pointermove', move)
      host.removeEventListener('pointerleave', leave)
      host.removeEventListener('pointerdown', press)
      canvas.removeEventListener('webglcontextlost', lost)
      canvas.removeEventListener('webglcontextrestored', restored)
      if (fontFace) document.fonts.delete(fontFace)
      release()
    }
  }, [generation])

  return <canvas aria-hidden="true" className={clsx('home-hero-canvas', className)} ref={canvasRef} />
}
