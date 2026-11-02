<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  export interface FooterLink {
    name: string
    href?: string
    disabled?: boolean
  }

  export interface FooterNavGroup {
    name: string
    links: FooterLink[]
  }

  export interface FooterProps extends HTMLAttributes<HTMLElement> {
    navGroups?: FooterNavGroup[]
    /** Replaces the notice; from Astro, a `copyright` slot. */
    copyright?: Snippet
  }
</script>

<script lang="ts">
  import '~/site/styles/docs-shell/footer.css'
  import clsx from 'clsx'
  import Link from './Link.svelte'
  import LanguageSelect from './LanguageSelect.svelte'
  import ThemeSelect from './ThemeSelect.svelte'
  import { useThemeMode } from '~/site/docs-shell/contexts/theme-mode.svelte'
  import IconChevronDown from '@tabler/icons-svelte-runes/icons/chevron-down'
  import IconDeviceDesktop from '@tabler/icons-svelte-runes/icons/device-desktop'
  import IconLanguage from '@tabler/icons-svelte-runes/icons/language'
  import IconMoon from '@tabler/icons-svelte-runes/icons/moon'
  import IconSun from '@tabler/icons-svelte-runes/icons/sun'
  import { getSite } from '../site'

  /** The site footer: link groups (legal links among them), then one quiet row: the notice, and the theme and language
   * preferences shown by an icon and their value alone (the selects carry their names). */
  let { navGroups = [], copyright, class: className, ...props }: FooterProps = $props()
  const themeMode = useThemeMode()
  const { locale, i18n, t } = getSite()
  const localeName = i18n.nameOfLocale[locale] ?? locale
  // The preference is read on the client; the server and the first paint show the default.
  const preference = $derived(themeMode.preference ?? 'system')
  const ThemeIcon = $derived(preference === 'light' ? IconSun : preference === 'dark' ? IconMoon : IconDeviceDesktop)
</script>

<footer {...props} class={clsx('ui-footer', className)}>
  <nav aria-label={t('Footer')} class="ui-footer-nav">
    {#each navGroups as group (group.name)}
      <div class="ui-footer-group">
        <h2>{t(group.name)}</h2>
        <ul>
          {#each group.links as link (link.href || link.name)}
            <li>
              <Link href={link.href} disabled={link.disabled}>{t(link.name)}</Link>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </nav>
  <div class="ui-footer-legal">
    <p class="ui-footer-notice">{#if copyright}{@render copyright()}{:else}© {new Date().getFullYear()} Aoyue Design LLC.{/if}</p>
    <label class="ui-footer-preference">
      <ThemeIcon aria-hidden="true" stroke={1.5} />
      {t(preference.charAt(0).toUpperCase() + preference.slice(1))}
      <ThemeSelect aria-label={t('Theme')} />
      <IconChevronDown aria-hidden="true" stroke={1.5} />
    </label>
    <label class="ui-footer-preference">
      <IconLanguage aria-hidden="true" stroke={1.5} />
      {localeName}
      <LanguageSelect aria-label={t('Language')} />
      <IconChevronDown aria-hidden="true" stroke={1.5} />
    </label>
  </div>
</footer>
