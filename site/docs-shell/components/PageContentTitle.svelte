<script lang="ts">
  interface Props {
    title: string
    translate?: (text: string) => string
  }

  /**
   * A contents entry's words: a title written as `code` is set in the mono face, any other title is translated. The
   * heading's text runs are joined with spaces when the contents are collected, so a space before punctuation that
   * followed inline code (`:hover`, `:active`) is taken out again.
   */
  let { title, translate }: Props = $props()
  const text = $derived(translate ? translate(title) : title)
</script>

{#if title.startsWith('`')}<code>{title.replace(/`/g, '')}</code>{:else}{text.replace(/\s+([,.;:!?)])/g, '$1').replace(/\(\s+/g, '(')}{/if}
