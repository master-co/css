/** A closed native disclosure keeps the complete output in the server HTML. */
export default function GeneratedCSS({ children }: { children: React.ReactNode }) {
  // Opening a native disclosure before streamed hydration must preserve that choice.
  return <details className="ui-disclosure" suppressHydrationWarning>
    <summary>Generated CSS</summary>
    {children}
  </details>
}
