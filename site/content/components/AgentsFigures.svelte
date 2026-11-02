<script lang="ts" module>
  import claudeLogo from '~/site/assets/images/home/clients/claude.svg?raw'
  import clineLogo from '~/site/assets/images/home/clients/cline.svg?raw'
  import cursorLogo from '~/site/assets/images/home/clients/cursor.svg?raw'
  import copilotLogo from '~/site/assets/images/home/clients/githubcopilot.svg?raw'
  import geminiLogo from '~/site/assets/images/home/clients/googlegemini.svg?raw'
  import windsurfLogo from '~/site/assets/images/home/clients/windsurf.svg?raw'
  import zedLogo from '~/site/assets/images/home/clients/zedindustries.svg?raw'
  // The same mark `brands.mastercss` names; islands draw it from its markup.
  import masterCSSLogo from '@master/internal-site/assets/brand/v2/logo/mark/master-mark-small-on-dark.svg?raw'

  export interface AgentsOrbitCall { key: string, response: boolean }

  /** Give an inline SVG file its attributes, prefixing its ids so the page's other copies never collide. */
  function sized(svg: string, size: number, prefix = '') {
    const marked = svg.replace('<svg', `<svg aria-hidden="true" height="${size}" width="${size}"`)
    return prefix ? marked.replace(/(\sid="|url\(#|href="#)/g, `$1${prefix}`) : marked
  }

  /** Local stdio clients. The links explain their setup; all brand marks remain native SVG. Codex draws the Tabler mark. */
  const mcpClients: { name: string, logo?: string, color?: string }[] = [
    { name: 'Claude Code', logo: sized(claudeLogo, 22), color: '#d97757' },
    { name: 'Codex' },
    { name: 'Cursor', logo: sized(cursorLogo, 22) },
    { name: 'GitHub Copilot', logo: sized(copilotLogo, 22) },
    { name: 'Gemini CLI', logo: sized(geminiLogo, 22), color: '#8e75b2' },
    { name: 'Windsurf', logo: sized(windsurfLogo, 22) },
    { name: 'Zed', logo: sized(zedLogo, 22), color: 'light-dark(#084ccf, color-mix(in oklab, #084ccf 50%, white))' },
    { name: 'Cline', logo: sized(clineLogo, 22) }
  ]

  const coreLogo = sized(masterCSSLogo, 34, 'home-mcp-')
</script>

<script lang="ts">
  import IconBrandOpenai from '@tabler/icons-svelte-runes/icons/brand-openai'
  import Link from '@master/internal-site/components/Link.svelte'
  import { getSite } from '@master/internal-site/site'
  import type { AgentsCanvas } from './agents-canvas'

  interface Props {
    call?: AgentsOrbitCall
    classRows: readonly string[]
    paused: boolean
  }

  /** Canvas owns the light, glass and signals; the DOM keeps the marks and setup links sharp. */
  let { call, classRows, paused }: Props = $props()
  const { t } = getSite()
  let root = $state<HTMLDivElement>()
  let stage = $state<HTMLDivElement>()
  let canvas = $state<HTMLCanvasElement>()
  let inView = $state(false)
  let renderer: AgentsCanvas | undefined
  // Primitive deriveds, so a new call object with the same key and response does not restart the painter.
  const callKey = $derived(call?.key)
  const callResponse = $derived(call?.response)

  // The figure loads its painter once it comes within 300px of the viewport.
  $effect(() => {
    if (!root || inView) return
    // Notifications batch while layout settles; the last entry is the current state.
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1]
      if (!entry.isIntersecting) return
      inView = true
      observer.disconnect()
    }, { rootMargin: '300px' })
    observer.observe(root)
    return () => observer.disconnect()
  })

  $effect(() => {
    if (!inView || !stage || !canvas) return
    const rows = classRows
    const scene = stage, drawing = canvas
    let disposed = false
    import('./agents-canvas').then(({ mountAgentsCanvas }) => {
      if (disposed) return
      renderer = mountAgentsCanvas(scene, drawing, rows)
      // The painter starts from the session's current call; reads in this callback are not tracked.
      renderer?.activity(callKey, paused, callResponse)
    }).catch(() => {
      // The native marks, links and CSS figure remain usable if enhancement cannot load.
    })
    return () => {
      disposed = true
      renderer?.dispose()
      renderer = undefined
    }
  })

  $effect(() => { renderer?.activity(callKey, paused, callResponse) })
</script>

<div bind:this={root} class="home-mcp">
  <div bind:this={stage} class="home-mcp-stage">
    <span aria-hidden="true" class="home-marks home-mcp-frame"></span>
    <span aria-hidden="true" class="home-mcp-beam"></span>
    <canvas bind:this={canvas} aria-hidden="true" class="home-mcp-canvas"></canvas>
    <span aria-hidden="true" class="home-mcp-fallback-ring"></span>
    <ul aria-label={t('MCP clients')} class="home-mcp-clients">
      {#each mcpClients as { color, name, logo }, index (name)}
        <li class="home-mcp-client" data-side={index === 0 || index >= 5 ? 'above' : 'below'} style:--home-mcp-angle={`${index * 45 - 22.5}deg`}>
          <Link aria-label={name} class="home-mcp-client-link" href="/guide/ai-coding#connect-the-mcp-server">
            <span class="home-mcp-client-mark" style:--home-brand={color}>
              {#if logo}{@html logo}{:else}<IconBrandOpenai aria-hidden="true" size={22} stroke={1.5} />{/if}
            </span>
            <span class="home-mcp-client-name">{name}</span>
          </Link>
        </li>
      {/each}
    </ul>
    <!-- The page lamp writes its light onto the core before or after hydration. -->
    <div class="home-lit home-mcp-core home-stone">
      {@html coreLogo}
      <span aria-hidden="true" class="home-mcp-core-label">MCP</span>
      <span class="sr-only">@master/css-mcp</span>
    </div>
  </div>
</div>
