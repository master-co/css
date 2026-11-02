<script lang="ts">
  import './footer.css'
  import IconChevronDown from '@tabler/icons-svelte-runes/icons/chevron-down'
  import IconDeviceDesktop from '@tabler/icons-svelte-runes/icons/device-desktop'
  import IconLanguage from '@tabler/icons-svelte-runes/icons/language'
  import IconMoon from '@tabler/icons-svelte-runes/icons/moon'
  import IconSun from '@tabler/icons-svelte-runes/icons/sun'
  import LanguageSelect from '~/site/docs-shell/components/LanguageSelect.svelte'
  import Link from '~/site/docs-shell/components/Link.svelte'
  import ThemeSelect from '~/site/docs-shell/components/ThemeSelect.svelte'
  import { useThemeMode } from '~/site/docs-shell/contexts/theme-mode.svelte'
  import { getSite } from '~/site/docs-shell/site'
  import { footerNavGroups } from '~/site/navigation'

  /** An open closing colophon, aligned to the page's drafting rails. */
  const { i18n, locale, t } = getSite()
  const themeMode = useThemeMode()
  // The preference is read on the client; the server and the first paint show the default.
  const preference = $derived(themeMode.preference ?? 'system')
  const ThemeIcon = $derived(preference === 'light' ? IconSun : preference === 'dark' ? IconMoon : IconDeviceDesktop)
</script>

<footer class="home-footer">
  <div aria-hidden="true" class="home-footer-drafting"></div>
  <div class="app-wrapper home-footer-wrap">
    <nav aria-label={t('Footer')} class="home-footer-nav">
      {#each footerNavGroups as group (group.name)}
        <div class="home-footer-group">
          <h2 class="home-footer-heading">{t(group.name)}</h2>
          <ul class="home-footer-links">
            {#each group.links as link (link.href)}
              <li>
                <Link class="home-footer-link" href={link.href}>{t(link.name)}</Link>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </nav>
    <div class="home-footer-base">
      <div class="home-footer-meta">
        <span class="home-footer-copyright">© {new Date().getFullYear()} Aoyue Design LLC.</span>
      </div>
      <div class="home-footer-preferences">
        <label class="home-footer-select">
          <ThemeIcon aria-hidden="true" size={15} stroke={1.5} />
          <span>{t(preference.charAt(0).toUpperCase() + preference.slice(1))}</span>
          <IconChevronDown aria-hidden="true" size={13} stroke={1.75} />
          <ThemeSelect aria-label={t('Theme')} />
        </label>
        <label class="home-footer-select">
          <IconLanguage aria-hidden="true" size={15} stroke={1.5} />
          <span>{i18n.nameOfLocale[locale] ?? locale}</span>
          <IconChevronDown aria-hidden="true" size={13} stroke={1.75} />
          <LanguageSelect aria-label={t('Language')} />
        </label>
      </div>
    </div>
    <p aria-hidden="true" class="home-footer-mark home-lit" data-mark="master css">master css</p>
  </div>
</footer>
