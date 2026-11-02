<script lang="ts" module>
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import 'dayjs/locale/zh-tw'
  import 'dayjs/locale/en'

  dayjs.extend(relativeTime)

  const locales: Record<string, string> = {
    tw: 'zh-tw',
    en: 'en'
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte'
  import { getSite } from '../site'

  /** The date when rendered; the reader's relative time once hydrated. */
  let { timestamp }: { timestamp: string | number | Date } = $props()
  const { locale } = getSite()
  let hydrated = $state(false)
  const formattedDate = $derived(hydrated
    ? dayjs(timestamp).locale(locales[locale]).fromNow()
    : dayjs(timestamp).format('ddd, MMMM D YYYY'))

  onMount(() => {
    hydrated = true
  })
</script>

{formattedDate}
