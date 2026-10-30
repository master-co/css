/** An optical bench for the MCP session. Layout and SVG marks stay in the DOM; only a live call
 * or a changing light owns an animation frame. The still figure needs no render loop. */
type Color = [number, number, number]
interface Point { x: number, y: number }
interface Tile extends Point { size: number }
interface Palette { ground: Color, sheet: Color, ink: Color, line: Color, signal: Color, dark: boolean, font: string }

export interface AgentsCanvas {
  activity: (key: string | undefined, paused: boolean, response?: boolean) => void
  dispose: () => void
}

const callDuration = 1900
const tau = Math.PI * 2
const rgb = (color: Color, alpha = 1) => `rgb(${color.join(' ')} / ${Math.max(0, Math.min(1, alpha))})`
const mix = (a: Color, b: Color, amount: number): Color => a.map((v, index) => v + (b[index] - v) * amount) as Color
const smooth = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t) }

export function mountAgentsCanvas(stage: HTMLElement, canvas: HTMLCanvasElement, classRows: readonly string[]): AgentsCanvas | undefined {
  let context: CanvasRenderingContext2D | null
  try { context = canvas.getContext('2d') } catch { return }
  if (!context) return
  const ctx = context
  const layer = document.createElement('canvas')
  const field = layer.getContext('2d')
  const sample = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const clients = [...stage.querySelectorAll<HTMLElement>('.home-mcp-client')]
  const coreElement = stage.querySelector<HTMLElement>('.home-mcp-core')
  if (!field || !sample || !coreElement || !clients.length) return
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const forced = matchMedia('(forced-colors: active)')
  const scheme = matchMedia('(prefers-color-scheme: dark)')
  let width = 0, height = 0, density = 1, frame = 0, gap = 0
  let radius = 1, depth = .31, center: Point = { x: 0, y: 0 }
  let tiles: Tile[] = [], core: Tile = { x: 0, y: 0, size: 1 }
  let colors: Palette
  let disposed = false, lost = false, visible = false, paused = true, callKey: string | undefined
  let elapsed = callDuration, previous = 0, selected = -1
  const light = { x: -.45, y: -.8, tx: -.45, ty: -.8 }

  function rounded(tile: Tile, offset = 0) {
    const path = new Path2D()
    path.roundRect(tile.x - tile.size / 2, tile.y - tile.size / 2 + offset, tile.size, tile.size, tile.size * .3)
    return path
  }

  function ellipse(target: CanvasRenderingContext2D, rx: number, ry: number, y = center.y) {
    target.beginPath()
    target.ellipse(center.x, y, rx, ry, 0, 0, tau)
  }

  function line(target: CanvasRenderingContext2D, from: Point, to: Point) {
    target.beginPath()
    target.moveTo(from.x, from.y)
    target.lineTo(to.x, to.y)
    target.stroke()
  }

  function theme() {
    const probe = document.createElement('span')
    probe.hidden = true
    stage.append(probe)
    const read = (name: string): Color => {
      probe.style.color = `var(${name})`
      sample!.clearRect(0, 0, 1, 1)
      sample!.fillStyle = getComputedStyle(probe).color
      sample!.fillRect(0, 0, 1, 1)
      return [...sample!.getImageData(0, 0, 1, 1).data].slice(0, 3) as Color
    }
    const ground = read('--home-ground')
    colors = {
      ground, sheet: read('--home-sheet'), ink: read('--home-text'), line: read('--home-rule-strong'),
      signal: read('--home-signal'), dark: ground[0] < 128, font: getComputedStyle(canvas).fontFamily
    }
    probe.remove()
    if (width) paintField()
    request()
  }

  function classes(target: CanvasRenderingContext2D) {
    target.font = `10px ${colors.font}`
    target.textAlign = 'center'
    target.textBaseline = 'middle'
    if (!classRows.length) return
    for (let row = -24; row <= 24; row++) {
      const source = classRows[(row + 24) % classRows.length]
      if (!source) continue
      const shift = (row + 24) * 13 % source.length
      target.fillText((source.slice(shift) + source + source).slice(0, 180), (row % 2) * 27, row * 19)
    }
  }

  /** The field is cached at display density. Class rows, etched spokes and the rim share a projection. */
  function paintField() {
    const f = field!
    layer.width = canvas.width
    layer.height = canvas.height
    f.setTransform(density, 0, 0, density, 0, 0)
    const white: Color = [255, 255, 255]
    const ringY = radius * depth

    // A short contact shadow holds the annular plate on the ground, instead of a floating glow.
    f.save()
    f.translate(center.x, center.y + 8)
    f.scale(1, depth)
    const shadow = f.createRadialGradient(0, 0, radius * .8, 0, 0, radius * 1.13)
    shadow.addColorStop(0, rgb(colors.ink, 0))
    shadow.addColorStop(.5, rgb([0, 0, 0], colors.dark ? .16 : .025))
    shadow.addColorStop(1, rgb(colors.ink, 0))
    f.fillStyle = shadow
    f.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4)
    f.restore()

    // The plate's lower edge is visible at the near side. A fine white lip catches the upper light.
    ellipse(f, radius + 13, ringY + 6, center.y + 4)
    f.fillStyle = rgb(mix(colors.ground, colors.ink, .035), .5)
    f.fill()
    f.strokeStyle = rgb(colors.ink, colors.dark ? .12 : .07)
    f.lineWidth = .75
    f.stroke()
    ellipse(f, radius + 13, ringY + 6)
    const plate = f.createLinearGradient(0, center.y - ringY, 0, center.y + ringY)
    plate.addColorStop(0, rgb(colors.sheet, colors.dark ? .13 : .46))
    plate.addColorStop(.52, rgb(colors.sheet, .04))
    plate.addColorStop(1, rgb(colors.sheet, colors.dark ? .2 : .34))
    f.fillStyle = plate
    f.fill()
    f.strokeStyle = rgb(colors.ink, colors.dark ? .1 : .07)
    f.stroke()

    // The actual project classes lie flat on the plate. They fade naturally at its boundary.
    f.save()
    ellipse(f, radius - 3, ringY - 1)
    f.clip()
    f.translate(center.x, center.y)
    f.scale(1, depth)
    const floor = f.createRadialGradient(0, 0, 15, 0, 0, radius)
    floor.addColorStop(0, rgb(colors.ink, .045))
    floor.addColorStop(.7, rgb(colors.ink, .015))
    floor.addColorStop(1, rgb(colors.ink, 0))
    f.fillStyle = floor
    classes(f)
    f.restore()

    // Screen-space ticks keep the same optical weight at the far and near edges of the ellipse.
    const outline = Array.from({ length: 721 }, (_, index) => {
      const angle = index / 720 * tau
      return { x: Math.cos(angle) * (radius + 23), y: Math.sin(angle) * (ringY + 12), distance: 0 }
    })
    for (let index = 1; index < outline.length; index++) {
      outline[index].distance = outline[index - 1].distance + Math.hypot(outline[index].x - outline[index - 1].x, outline[index].y - outline[index - 1].y)
    }
    const circumference = outline[outline.length - 1].distance
    const tickCount = Math.round(circumference / 12)
    let segment = 1
    for (let index = 0; index < tickCount; index++) {
      const distance = index / tickCount * circumference
      while (outline[segment].distance < distance) segment++
      const a = outline[segment - 1], b = outline[segment]
      const ratio = (distance - a.distance) / (b.distance - a.distance)
      const point = { x: center.x + a.x + (b.x - a.x) * ratio, y: center.y + a.y + (b.y - a.y) * ratio }
      const nx = b.y - a.y, ny = a.x - b.x
      const length = Math.hypot(nx, ny)
      const major = index % 5 === 0
      f.strokeStyle = rgb(colors.ink, major ? .24 : .13)
      f.lineWidth = major ? .85 : .65
      line(f, point, { x: point.x + nx / length * (major ? 6 : 3), y: point.y + ny / length * (major ? 6 : 3) })
    }

    // A thin frosting band inside the lip, with a single engraved circuit to each client.
    ellipse(f, radius + 7, ringY + 3)
    f.lineWidth = .6
    f.strokeStyle = rgb(white, colors.dark ? .07 : .8)
    f.stroke()
    for (const tile of tiles) {
      const foot = { x: tile.x, y: tile.y + tile.size / 2 + 6 }
      const dx = foot.x - center.x, dy = foot.y - center.y
      const start = .16
      f.setLineDash([2, 5])
      f.strokeStyle = rgb(colors.ink, .12)
      f.lineWidth = .65
      line(f, { x: center.x + dx * start, y: center.y + dy * start }, foot)
      f.setLineDash([])
      f.beginPath()
      f.ellipse(foot.x, foot.y, 2, 2 * depth, 0, 0, tau)
      f.fillStyle = rgb(colors.sheet, .8)
      f.fill()
      f.strokeStyle = rgb(colors.ink, .25)
      f.stroke()
    }
  }

  /** A front-facing, thick glass lens. The lower bevel refracts the ground and top-left rim stays lit. */
  function glass(tile: Tile, coreTile = false, warmth = 0) {
    const { x, y, size } = tile
    const path = rounded(tile)
    const white: Color = [255, 255, 255]
    ctx.save()
    // Contact and a separate cast shadow: neither is a broad card-shaped drop shadow.
    ctx.translate(x, y + size / 2 + 6)
    ctx.scale(1, .25)
    const shadow = ctx.createRadialGradient(0, 0, 1, 0, 0, size * .85)
    shadow.addColorStop(0, rgb([0, 0, 0], colors.dark ? .34 : .09))
    shadow.addColorStop(1, 'transparent')
    ctx.fillStyle = shadow
    ctx.fillRect(-size, -size, size * 2, size * 2)
    ctx.restore()

    ctx.fillStyle = rgb(mix(colors.ground, colors.ink, colors.dark ? .025 : .065), .6)
    ctx.fill(rounded(tile, 3))
    ctx.strokeStyle = rgb(colors.ink, colors.dark ? .1 : .07)
    ctx.lineWidth = .7
    ctx.stroke(rounded(tile, 3))

    const body = ctx.createLinearGradient(x - size / 2, y - size / 2, x + size / 2, y + size / 2)
    body.addColorStop(0, rgb(mix(colors.sheet, white, colors.dark ? .14 : .18), .76))
    body.addColorStop(.45, rgb(colors.sheet, .46))
    body.addColorStop(.85, rgb(mix(colors.sheet, colors.ground, .5), .52))
    body.addColorStop(1, rgb(mix(colors.sheet, colors.ink, colors.dark ? .08 : .025), .78))
    // The floor is magnified through the lens. Its native SVG mark remains on the front surface.
    ctx.save()
    ctx.clip(path)
    ctx.translate(x, y)
    ctx.scale(1.12, 1.2)
    ctx.translate(-x, -y)
    ctx.globalAlpha = .48
    ctx.drawImage(layer, 0, 0, width, height)
    ctx.restore()
    ctx.fillStyle = body
    ctx.fill(path)

    ctx.save()
    ctx.clip(path)
    // The reflected softbox slides a fraction as the pointer moves; the logos themselves never move.
    const sheenX = x + light.x * size * .4
    const sheen = ctx.createRadialGradient(sheenX, y + light.y * size * .4, 0, sheenX, y + light.y * size * .4, size)
    sheen.addColorStop(0, rgb(white, colors.dark ? .16 : .7))
    sheen.addColorStop(.56, rgb(white, colors.dark ? .025 : .1))
    sheen.addColorStop(1, rgb(white, 0))
    ctx.fillStyle = sheen
    ctx.fillRect(x - size / 2, y - size / 2, size, size)
    // A light-gathering lower meniscus gives the glass visible thickness without a second heavy ring.
    const lower = ctx.createLinearGradient(0, y + size * .25, 0, y + size * .5)
    lower.addColorStop(0, rgb(white, 0))
    lower.addColorStop(.8, rgb(white, colors.dark ? .035 : .25))
    lower.addColorStop(1, rgb(colors.ink, colors.dark ? .1 : .055))
    ctx.fillStyle = lower
    ctx.fillRect(x - size / 2, y, size, size / 2)
    ctx.restore()

    const rim = ctx.createLinearGradient(x - size / 2, y - size / 2, x + size / 2, y + size / 2)
    rim.addColorStop(0, rgb(white, colors.dark ? .48 : 1))
    rim.addColorStop(.38, rgb(colors.ink, colors.dark ? .08 : .025))
    rim.addColorStop(.72, rgb(colors.ink, colors.dark ? .16 : .07))
    rim.addColorStop(1, rgb(white, colors.dark ? .18 : .86))
    ctx.strokeStyle = rim
    ctx.lineWidth = 1
    ctx.stroke(path)
    if (coreTile) {
      ctx.beginPath()
      ctx.arc(x + size * .3, y + size * .3, 1.25, 0, tau)
      ctx.fillStyle = rgb(warmth > 0 ? colors.signal : colors.ink, warmth > 0 ? .8 : .25)
      ctx.fill()
    }
    if (coreTile && warmth > 0) {
      ctx.save()
      ctx.strokeStyle = rgb(colors.signal, warmth * .9)
      ctx.shadowColor = rgb(colors.signal, warmth * .45)
      ctx.shadowBlur = 16
      ctx.stroke(path)
      ctx.restore()
    }
  }

  function beam(progress: number, returning: boolean) {
    const end = core.y - core.size / 2
    const y = returning ? end * (1 - progress) : end * progress
    ctx.save()
    const color = returning ? colors.ink : colors.signal
    const tail = ctx.createLinearGradient(0, y + (returning ? 24 : -24), 0, y)
    tail.addColorStop(0, rgb(color, 0))
    tail.addColorStop(1, rgb(color, .8))
    ctx.strokeStyle = tail
    ctx.lineWidth = 1.5
    line(ctx, { x: center.x, y: y + (returning ? 24 : -24) }, { x: center.x, y })
    ctx.fillStyle = rgb(color, .95)
    ctx.shadowColor = rgb(color, .6)
    ctx.shadowBlur = returning ? 3 : 9
    ctx.beginPath()
    ctx.arc(center.x, y, 2, 0, tau)
    ctx.fill()
    ctx.restore()
  }

  function draw() {
    if (!width || !height || !colors || lost) return
    ctx.setTransform(density, 0, 0, density, 0, 0)
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(layer, 0, 0, width, height)
    const phase = elapsed / callDuration
    const live = phase > 0 && phase < 1 && !reduced.matches
    const warmth = live ? Math.sin(smooth((phase - .15) / .8) * Math.PI) : 0
    // One continuous connection from the session's port to the top of the server.
    ctx.strokeStyle = rgb(colors.ink, .16)
    ctx.lineWidth = .7
    line(ctx, { x: center.x, y: 1 }, { x: center.x, y: core.y - core.size / 2 })
    ctx.beginPath()
    ctx.arc(center.x, 1, 2.5, 0, tau)
    ctx.fillStyle = rgb(colors.ground)
    ctx.fill()
    ctx.stroke()

    if (live) {
      // Reading begins when the request reaches the server and settles before its result returns.
      const wave = smooth((phase - .26) / .32)
      if (wave > 0 && wave < 1) {
        ctx.save()
        ellipse(ctx, radius, radius * depth)
        ctx.clip()
        ctx.translate(center.x, center.y)
        ctx.scale(1, depth)
        const reach = Math.max(1, radius * wave * 1.3)
        const reveal = ctx.createRadialGradient(0, 0, Math.max(0, reach - 80), 0, 0, reach + 15)
        reveal.addColorStop(0, rgb(colors.ink, 0))
        reveal.addColorStop(.65, rgb(colors.ink, (1 - wave) * .4))
        reveal.addColorStop(1, rgb(colors.ink, 0))
        ctx.fillStyle = reveal
        classes(ctx)
        ctx.restore()
        const front = wave * 1.3
        const edge = 1 - smooth((front - .9) / .12)
        ctx.strokeStyle = rgb(colors.signal, (1 - wave) * .32 * edge)
        ctx.lineWidth = .8
        ellipse(ctx, radius * front, radius * depth * front)
        ctx.stroke()
      }
      if (phase < .26) beam(smooth(phase / .26), false)
      if (phase > .7) beam(smooth((phase - .7) / .3), true)
    }

    if (selected >= 0) {
      const tile = tiles[selected]
      const foot = { x: tile.x, y: tile.y + tile.size / 2 + 6 }
      const connection = ctx.createLinearGradient(center.x, center.y, foot.x, foot.y)
      connection.addColorStop(0, rgb(colors.ink, .03))
      connection.addColorStop(1, rgb(colors.ink, .3))
      ctx.strokeStyle = connection
      ctx.lineWidth = .8
      line(ctx, center, foot)
    }

    // Painter order leaves the front clients in front of the central server, without moving SVGs.
    const ordered = tiles.map((tile, index) => ({ tile, index, isCore: false }))
    ordered.push({ tile: core, index: -1, isCore: true })
    ordered.sort((a, b) => (a.tile.y + a.tile.size / 2) - (b.tile.y + b.tile.size / 2))
    for (const { tile, index, isCore } of ordered) {
      glass(tile, isCore, warmth)
      if (index === selected) {
        ctx.strokeStyle = rgb(colors.ink, .28)
        ctx.lineWidth = 1
        ctx.stroke(rounded(tile))
      }
    }
  }

  function tick(now: number) {
    frame = 0
    if (!paused && previous && elapsed < callDuration && !reduced.matches) elapsed = Math.min(callDuration, elapsed + Math.min(now - previous, 64))
    previous = now
    light.x += (light.tx - light.x) * .15
    light.y += (light.ty - light.y) * .15
    draw()
    if ((!paused && elapsed < callDuration && !reduced.matches) || Math.abs(light.tx - light.x) + Math.abs(light.ty - light.y) > .005) request()
  }

  function request() {
    if (!disposed && !lost && !frame && visible && !document.hidden && !forced.matches) frame = requestAnimationFrame(tick)
  }

  function resize() {
    if (lost || disposed) return
    const rect = canvas.getBoundingClientRect()
    width = rect.width
    height = rect.height
    gap = stage.getBoundingClientRect().top - rect.top
    // The renderer measures the native layout, so enlarged text and CSS fallback use the same geometry.
    tiles = clients.map((element) => ({ x: element.offsetLeft, y: element.offsetTop + gap, size: element.offsetWidth }))
    core = { x: coreElement!.offsetLeft, y: coreElement!.offsetTop + gap, size: coreElement!.offsetWidth }
    center = { x: width / 2, y: core.y + core.size / 2 + 6 }
    radius = (tiles[0].x - center.x) / Math.cos(-Math.PI / 8)
    // Opposite feet recover the actual projected ellipse, including its minimum touch spacing.
    const nearFoot = tiles[2].y + tiles[2].size / 2
    const farFoot = tiles[6].y + tiles[6].size / 2
    depth = (nearFoot - farFoot) / (2 * Math.sin(3 * Math.PI / 8) * radius)
    density = Math.min(devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * density)
    canvas.height = Math.round(height * density)
    theme()
    draw()
    stage.dataset.canvasReady = ''
  }

  function select(target: EventTarget | null) {
    const element = target instanceof Element ? target.closest('.home-mcp-client') : null
    selected = clients.findIndex((client) => client === element)
    request()
  }

  function move(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return
    select(event.target)
    if (reduced.matches) return
    const rect = stage.getBoundingClientRect()
    light.tx = (event.clientX - rect.left) / width * 1.6 - .8
    light.ty = (event.clientY - rect.top) / (height - gap) * 1.2 - .9
  }

  function leave() {
    light.tx = -.45
    light.ty = -.8
    select(document.activeElement)
  }

  function focus(event: FocusEvent) { select(event.target) }
  function blur(event: FocusEvent) { select(event.relatedTarget) }
  function visibility() {
    previous = 0
    if (document.hidden || forced.matches || !visible) {
      cancelAnimationFrame(frame)
      frame = 0
    } else request()
  }
  function contrast() {
    // Resizing in forced colors caches system colors; restore the page palette before revealing it.
    if (!forced.matches) theme()
    visibility()
  }
  function motion() {
    if (reduced.matches) elapsed = callDuration
    light.x = light.tx = -.45
    light.y = light.ty = -.8
    request()
  }
  function contextLost() {
    lost = true
    cancelAnimationFrame(frame)
    frame = 0
    delete stage.dataset.canvasReady
  }
  function contextRestored() {
    lost = false
    resize()
    request()
  }

  const resizeObserver = new ResizeObserver(resize)
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visibility() })
  const themeObserver = new MutationObserver(theme)
  resizeObserver.observe(stage)
  intersection.observe(canvas)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] })
  reduced.addEventListener('change', motion)
  forced.addEventListener('change', contrast)
  scheme.addEventListener('change', theme)
  document.addEventListener('visibilitychange', visibility)
  stage.addEventListener('pointermove', move)
  stage.addEventListener('pointerleave', leave)
  stage.addEventListener('focusin', focus)
  stage.addEventListener('focusout', blur)
  canvas.addEventListener('contextlost', contextLost)
  canvas.addEventListener('contextrestored', contextRestored)
  document.fonts.ready.then(() => { if (!disposed) resize() })

  function dispose() {
    disposed = true
    cancelAnimationFrame(frame)
    resizeObserver.disconnect()
    intersection.disconnect()
    themeObserver.disconnect()
    reduced.removeEventListener('change', motion)
    forced.removeEventListener('change', contrast)
    scheme.removeEventListener('change', theme)
    document.removeEventListener('visibilitychange', visibility)
    stage.removeEventListener('pointermove', move)
    stage.removeEventListener('pointerleave', leave)
    stage.removeEventListener('focusin', focus)
    stage.removeEventListener('focusout', blur)
    canvas.removeEventListener('contextlost', contextLost)
    canvas.removeEventListener('contextrestored', contextRestored)
    layer.width = layer.height = canvas.width = canvas.height = 0
    delete stage.dataset.canvasReady
  }

  try { resize() } catch {
    dispose()
    return
  }

  return {
    activity(key, hold, response) {
      if (key !== callKey) {
        callKey = key
        elapsed = key && !reduced.matches ? 0 : callDuration
      }
      if (response) elapsed = Math.max(elapsed, callDuration * .7)
      paused = hold
      previous = 0
      request()
    },
    dispose
  }
}
