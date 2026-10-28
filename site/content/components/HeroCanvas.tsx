'use client'

import { useEffect, useRef } from 'react'
import clsx from 'clsx'

/** The silk renders at this share of the device's pixel density: its folds are soft, and the grain on top is CSS at full density. */
const renderScale = 0.6
/** The shader's plane spans this many units of the canvas height, which sets how many folds fit across it. */
const planeScale = 5.5
/** The silk rises out of the ground over this long when the page opens. */
const introDuration = 2400

const vertexSource = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`

const fragmentSource = `
precision highp float;
varying vec2 vUv;
uniform vec2 resolution;
uniform float time;
uniform float intro;
uniform float rise;
uniform vec3 pointer;
uniform vec3 ring;
uniform vec3 shadow;
uniform vec3 body;
uniform vec3 sheen;

// The cloth's height: three folds flowing over a slowly warped plane, the pointer's lift and a click's ring.
float cloth(vec2 p) {
  vec2 q = p + 0.32 * vec2(sin(p.y * 1.6 + time * 0.23), sin(p.x * 1.2 - time * 0.19));
  float h = sin(q.x * 1.5 + q.y * 0.8 + time * 0.31) * 0.55;
  h += sin(q.x * 0.6 - q.y * 1.7 + time * 0.21 + sin(q.x * 0.45 + time * 0.12) * 1.6) * 0.38;
  h += sin((q.x + q.y) * 2.6 - time * 0.42) * 0.1;
  vec2 toPointer = p - pointer.xy;
  h += pointer.z * 0.45 * exp(-dot(toPointer, toPointer) * 1.4);
  if (ring.z >= 0.0) {
    float front = length(p - ring.xy) - ring.z * 2.2;
    h += 0.3 * exp(-front * front * 5.0) * max(0.0, 1.0 - ring.z / 2.4);
  }
  return h;
}

void main() {
  float aspect = resolution.x / resolution.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * ${planeScale.toFixed(1)};
  float e = 0.012;
  float h = cloth(p);
  vec2 slope = vec2(cloth(p + vec2(e, 0.0)) - h, cloth(p + vec2(0.0, e)) - h) / e;
  vec3 normal = normalize(vec3(-slope * 0.4, 1.0));
  // A low light from the upper left; the pointer pulls it across the cloth.
  vec3 light = normalize(vec3(-0.5 + pointer.z * 0.25 * pointer.x / aspect, 0.62, 0.6));
  float lit = max(dot(normal, light), 0.0);
  // Satin: a broad sheen over each fold and a narrow glint along its ridge.
  float facing = max(dot(normal, normalize(light + vec3(0.0, 0.0, 1.0))), 0.0);
  float gloss = pow(facing, 18.0) + pow(facing, 90.0) * 0.6;
  vec3 color = mix(shadow, body, smoothstep(0.05, 0.9, lit));
  color = mix(color, sheen, clamp(gloss + pow(lit, 10.0) * 0.3, 0.0, 1.0));
  // The cloth's upper edge dips under the copy and rises toward both sides; the folds ripple it.
  float x = vUv.x - 0.5;
  float edge = rise + 0.95 * x * x + h * 0.05;
  float alpha = (1.0 - smoothstep(edge - 0.24, edge + 0.02, vUv.y)) * intro;
  // A soft clearing behind the copy keeps the silk out of the text, and the silk settles back into
  // the ground before the section's bottom rule.
  alpha *= smoothstep(0.3, 1.0, length((vUv - vec2(0.5, 0.56)) / vec2(0.46, 0.34)));
  alpha *= smoothstep(0.0, 0.16, vUv.y);
  gl_FragColor = vec4(color * alpha, alpha);
}`

/**
 * A sheet of gold silk flowing under the copy. A fragment shader folds the cloth, lights it from
 * the upper left and lets its edge dip under the headline and rise toward both sides, clearing a
 * soft space behind the text; a CSS grain on top frosts it. The pointer lifts the cloth and drags the light, a click sends a ring through
 * it, and scrolling the hero away quickens the flow. Without WebGL the section keeps its static glow.
 */
export default function HeroCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true })
    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
    if (!canvas || !gl || !probe) return
    const host = canvas.closest<HTMLElement>('[data-glyph-host]') ?? canvas
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }
    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)
    // One triangle that covers the whole canvas.
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    const uniform = (name: string) => gl.getUniformLocation(program, name)
    const uniforms = {
      resolution: uniform('resolution'),
      time: uniform('time'),
      intro: uniform('intro'),
      rise: uniform('rise'),
      pointer: uniform('pointer'),
      ring: uniform('ring'),
      shadow: uniform('shadow'),
      body: uniform('body'),
      sheen: uniform('sheen')
    }

    let width = 0
    let height = 0
    let frame = 0
    let visible = true
    let startedAt = -1
    let ringAt = -1
    const ringPoint = { x: 0, y: 0 }
    // The pointer in the shader's plane, eased toward where it is aimed.
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, targetStrength: 0 }

    /** Any CSS color as 0–1 sRGB channels for the shader, by painting one pixel of it. */
    const toChannels = (color: string) => {
      probe.clearRect(0, 0, 1, 1)
      probe.fillStyle = '#000'
      probe.fillStyle = color
      probe.fillRect(0, 0, 1, 1)
      const [red, green, blue] = probe.getImageData(0, 0, 1, 1).data
      return [red / 255, green / 255, blue / 255] as const
    }

    // The silk's shadow, body and sheen come from the canvas's `color`, `caret-color` and `outline-color`.
    const readStyle = () => {
      const style = getComputedStyle(canvas)
      gl.uniform3f(uniforms.shadow, ...toChannels(style.color))
      gl.uniform3f(uniforms.body, ...toChannels(style.caretColor))
      gl.uniform3f(uniforms.sheen, ...toChannels(style.outlineColor))
    }

    const layout = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const ratio = Math.min(devicePixelRatio || 1, 2) * renderScale
      canvas.width = Math.max(1, Math.round(width * ratio))
      canvas.height = Math.max(1, Math.round(height * ratio))
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
      // Narrow screens stack the copy taller, so the cloth stays lower under it.
      gl.uniform1f(uniforms.rise, width < 640 ? 0.26 : 0.4)
      readStyle()
    }

    /** A screen point in the shader's plane, centered on the canvas. */
    const toPlane = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: ((clientX - rect.left) / rect.width - 0.5) * (rect.width / rect.height) * planeScale,
        y: (0.5 - (clientY - rect.top) / rect.height) * planeScale
      }
    }

    const draw = (time: number) => {
      if (startedAt < 0) startedAt = time
      pointer.x += (pointer.targetX - pointer.x) * 0.06
      pointer.y += (pointer.targetY - pointer.y) * 0.06
      pointer.strength += (pointer.targetStrength - pointer.strength) * 0.04
      const opened = reduceMotion ? 1 : Math.min(1, (time - startedAt) / introDuration)
      // Scrolling the hero away quickens the flow.
      const flow = (time + Math.min(window.scrollY, height) * 6) / 1000
      gl.uniform1f(uniforms.time, reduceMotion ? 8 : flow)
      gl.uniform1f(uniforms.intro, 1 - Math.pow(1 - opened, 3))
      gl.uniform3f(uniforms.pointer, pointer.x, pointer.y, pointer.strength)
      gl.uniform3f(uniforms.ring, ringPoint.x, ringPoint.y, ringAt < 0 ? -1 : (time - ringAt) / 1000)
      if (ringAt >= 0 && time - ringAt > 2400) ringAt = -1
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const tick = (time: number) => {
      frame = requestAnimationFrame(tick)
      if (visible) draw(time)
    }

    const onPointerMove = (event: PointerEvent) => {
      const point = toPlane(event.clientX, event.clientY)
      pointer.targetX = point.x
      pointer.targetY = point.y
      pointer.targetStrength = 1
    }
    const onPointerLeave = () => {
      pointer.targetStrength = 0
    }
    const onPointerDown = (event: PointerEvent) => {
      Object.assign(ringPoint, toPlane(event.clientX, event.clientY))
      ringAt = performance.now()
    }

    layout()
    const resize = new ResizeObserver(() => {
      layout()
      if (reduceMotion) draw(0)
    })
    resize.observe(canvas)
    const restyle = () => {
      readStyle()
      if (reduceMotion) draw(0)
    }
    const theme = new MutationObserver(restyle)
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] })
    const scheme = matchMedia('(prefers-color-scheme: dark)')
    scheme.addEventListener('change', restyle)
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    intersection.observe(canvas)
    if (reduceMotion) {
      draw(0)
    } else {
      host.addEventListener('pointermove', onPointerMove)
      host.addEventListener('pointerleave', onPointerLeave)
      host.addEventListener('pointerdown', onPointerDown)
      frame = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      theme.disconnect()
      intersection.disconnect()
      scheme.removeEventListener('change', restyle)
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerleave', onPointerLeave)
      host.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

  return <canvas aria-hidden="true" className={clsx('home-hero-canvas', className)} ref={canvasRef} />
}
