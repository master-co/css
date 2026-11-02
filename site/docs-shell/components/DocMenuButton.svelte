<script lang="ts" module>
  import type { Attachment } from 'svelte/attachments'

  /** The sheet lives at the end of the body, outside the header that opens it. */
  const portal: Attachment<HTMLElement> = (node) => {
    document.body.append(node)
    return () => node.remove()
  }
</script>

<script lang="ts">
  import '~/site/styles/docs-shell/menu.css'
  import clsx from 'clsx'
  import Link from './Link.svelte'
  import DocSidebar, { type DocSidebarProps } from './DocSidebar.svelte'
  import SearchButton from './SearchButton.svelte'
  import IconArrowUpRight from '@tabler/icons-svelte-runes/icons/arrow-up-right'
  import IconMenu2 from '@tabler/icons-svelte-runes/icons/menu-2'
  import IconX from '@tabler/icons-svelte-runes/icons/x'
  import ThemeSelect from './ThemeSelect.svelte'
  import DocVersionSelect from './DocVersionSelect.svelte'
  import LanguageSelect from './LanguageSelect.svelte'
  import app from '~/site/app-config'
  import { getSite } from '../site'

  interface Props {
    class?: string
    documentNavigation?: DocSidebarProps['pageCategories']
    documentNavigationTitle?: string
  }

  /** The compact header's menu: site sections, the section's chapters, community links and preferences in one sheet. */
  let { class: className, documentNavigation, documentNavigationTitle }: Props = $props()
  let opened = $state(false)
  const id = $props.id()
  let dialog = $state<HTMLDialogElement>()
  let trigger = $state<HTMLButtonElement>()
  const { t, locale } = getSite()
  const tw = locale === 'tw'

  function close() {
    dialog?.close()
    opened = false
    trigger?.focus({ preventScroll: true })
  }

  $effect(() => {
    if (!opened) return
    const element = dialog
    if (element && !element.open) element.showModal()
    const wide = matchMedia('(width >= 64rem)')
    const resize = () => { if (wide.matches) close() }
    wide.addEventListener('change', resize)
    return () => wide.removeEventListener('change', resize)
  })
</script>

<button bind:this={trigger} type="button" class={clsx('ui-button', className)} data-variant="quiet" data-shape="icon"
  aria-label={t('Menu')} aria-expanded={opened} aria-haspopup="dialog" aria-controls={opened ? id : undefined}
  onclick={() => { opened = !opened }}>
  <IconMenu2 size={20} stroke={1.5} aria-hidden="true" />
</button>
{#if opened}
  <dialog bind:this={dialog} {@attach portal} {id} class="ui-dialog" data-variant="sheet" aria-labelledby={`${id}-title`} oncancel={event => { event.preventDefault(); close() }}>
    <div class="ui-dialog-bar">
      <button type="button" class="ui-button" data-variant="quiet" data-shape="icon" onclick={close} aria-label={tw ? '關閉選單' : 'Close menu'}><IconX size={20} stroke={1.5} aria-hidden="true" /></button>
      <Link href="/" class="ui-header-brand" onclick={close} aria-label={tw ? 'Master CSS 首頁' : 'Master CSS home'}><app.Logotype style="height: 20px; width: auto" aria-hidden="true" /></Link>
    </div>
    <div class="ui-dialog-body">
      <h2 class="sr-only" id={`${id}-title`}>{tw ? '網站導覽' : 'Navigation'}</h2>
      <SearchButton class="ui-search-trigger" />
      <nav class="ui-nav-group" aria-label={tw ? '主要導覽' : 'Main navigation'}>
        {#each app.navs as { Icon, disabled, fullName, ...link } (link.name)}<Link class="ui-nav-link" current="true" ambiguous {...link} {disabled} onclick={close}>
          {#if Icon}<Icon size={18} stroke={1.5} aria-hidden="true" />{/if}{t(fullName || link.name)}
        </Link>{/each}
      </nav>
      {#if documentNavigation?.length}<details class="ui-disclosure" data-variant="rule" open>
        <summary>{t(documentNavigationTitle || 'Documentation')}<span class="ui-disclosure-meta">{tw ? '文件章節' : 'Chapters'}</span></summary>
        <DocSidebar embedded includeNestedPages pageCategories={documentNavigation} onNavigate={close} />
      </details>{/if}
      {#if app.communityNavs?.length}<nav class="ui-nav-group" aria-labelledby={`${id}-community`}>
        <h4 id={`${id}-community`}>{t('Community')}</h4>
        {#each app.communityNavs as { Icon, disabled, fullName, ...link } (link.name)}<Link class="ui-nav-link" {...link} {disabled} onclick={close}>
          {#if Icon}<Icon size={18} stroke={1.5} aria-hidden="true" />{/if}{t(fullName || link.name)}<IconArrowUpRight size={14} stroke={1.5} aria-hidden="true" />
        </Link>{/each}
      </nav>{/if}
      <section class="ui-dialog-fields" aria-labelledby={`${id}-system`}>
        <h4 id={`${id}-system`}>{t('System')}</h4>
        {#if app.versions.length > 0}<label class="ui-field">{t('Version')}<DocVersionSelect data-variant={undefined} /></label>{/if}
        <label class="ui-field">{t('Language')}<LanguageSelect data-variant={undefined} /></label>
        <label class="ui-field">{t('Theme')}<ThemeSelect data-variant={undefined} /></label>
      </section>
    </div>
  </dialog>
{/if}
