/** The preview syntax chosen anywhere on the page (`change:preview-syntax`); call during component initialization. */
export default function useSelectedPreviewSyntax(defaultValue: string) {
  let previewSyntax = $state(defaultValue)
  $effect(() => {
    const onChange = (event: any) => {
      previewSyntax = event.detail
    }
    window.addEventListener('change:preview-syntax', onChange, { passive: true })
    return () => window.removeEventListener('change:preview-syntax', onChange)
  })
  return {
    get current() {
      return previewSyntax
    }
  }
}
