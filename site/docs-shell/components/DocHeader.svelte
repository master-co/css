<script lang="ts" module>
  import type { DocSidebarProps } from './DocSidebar.svelte'

  export interface DocHeaderProps {
    class?: string
    /** See `Header`: overlays the page and slides away while reading down. */
    stickable?: boolean
    transitionAtTop?: boolean
    /** Chapters the compact menu lists. */
    documentNavigation?: DocSidebarProps['pageCategories']
    documentNavigationTitle?: string
    /** Accepted for section shells; the header always spans the page. */
    contained?: boolean
  }
</script>

<script lang="ts">
  // `.app-wrapper` sets the homepage sections' column gutters; the homepage loads it through this header.
  import '~/site/styles/docs-shell/wrapper.css'
  import Header from './Header.svelte'
  import HeaderNav from './HeaderNav.svelte'
  import LanguageButton from './LanguageButton.svelte'
  import IconChevronDown from '@tabler/icons-svelte-runes/icons/chevron-down'
  import IconSearch from '@tabler/icons-svelte-runes/icons/search'
  import DocVersionSelect from './DocVersionSelect.svelte'
  import Link from './Link.svelte'
  import DocMenuButton from './DocMenuButton.svelte'
  import SearchButton from './SearchButton.svelte'
  import isDateWithinSevenDays from '../utils/is-date-within-seven-days'
  import app from '~/site/app-config'
  import { getSite } from '../site'

  let { class: className, stickable, transitionAtTop, documentNavigation, documentNavigationTitle }: DocHeaderProps = $props()
  const { t, locale, pathname } = getSite()
  const tw = locale === 'tw'
  const home = pathname === (tw ? '/tw' : '/')
  const version = `v${import.meta.env.PUBLIC_VERSION}`
</script>

<Header class={className} {stickable} {transitionAtTop}>
  <DocMenuButton class="ui-header-menu" {documentNavigation} {documentNavigationTitle} />
  <Link href="/" class="ui-header-brand" aria-label={tw ? 'Master CSS 首頁' : 'Master CSS home'} oncontextmenu={(event: MouseEvent) => {
    event.preventDefault()
    location.assign('/brand')
  }}>
    <app.Logotype style="height: 20px; width: auto" aria-hidden="true" />
  </Link>
  {#if app.versions.length}
    <label class="ui-version">
      {version}
      <DocVersionSelect aria-label={t('Version')} />
      <IconChevronDown aria-hidden="true" stroke={1.5} />
    </label>
  {:else}
    <span class="ui-version">{version}</span>
  {/if}
  <nav class="ui-header-nav" aria-label={tw ? '主要導覽' : 'Main navigation'}>
    {#each app.navs as { Icon: _Icon, fullName: _fullName, ...eachLink } (eachLink.name)}<HeaderNav {...eachLink}>
      {t(eachLink.name)}
      {#if eachLink.date && isDateWithinSevenDays(eachLink.date)}<small>{t('New')}</small>{/if}
    </HeaderNav>{/each}
  </nav>
  <div class="ui-header-end">
    <!-- Search leads the end group as a quiet pill: the glass and its shortcut. The homepage leaves it to the compact header. -->
    <SearchButton class="ui-header-search" data-compact={home ? '' : undefined}>
      <IconSearch size={16} stroke={1.5} aria-hidden="true" />
      <kbd class="ui-kbd" aria-hidden="true">⌘K</kbd>
    </SearchButton>
    {#each app.communityNavs ?? [] as { Icon, disabled, fullName, ...eachLink } (eachLink.name)}
      <Link
        {...eachLink}
        aria-label={fullName || eachLink.name}
        class="ui-button"
        data-variant="quiet"
        data-shape="icon"
        data-size="sm"
        data-disabled={disabled || undefined}
        {disabled}
      >
        {#if Icon}<Icon size={18} stroke={1.5} aria-hidden="true" />{/if}
        <span class="ui-tooltip" data-side="bottom" aria-hidden="true">{fullName || eachLink.name}</span>
      </Link>
    {/each}
    {#if app.communityNavs?.length}<span class="ui-header-divider" aria-hidden="true"></span>{/if}
    <LanguageButton />
  </div>
</Header>
