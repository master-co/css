export default function Home() {
  return (
    <main className="min-height:100vh padding:2.5rem bg-surface-base fg-strong font-sans">
      <section className="max-width:720px margin-inline:auto">
        <p className="font-size:14px fg-primary margin-bottom:0.5rem">Next.js Adapter API</p>
        <h1 className="font-size:48px font-heavy tracking-tight">Master CSS pre-rendered by Next build</h1>
        <p className="font-size:20px line-height:1.5 margin-top:1rem fg-slate">
          This page is statically rendered by Next.js, then processed by the Master CSS adapter.
        </p>
        <a className="display:inline-flex align-items:center height:44px padding-inline:1.25rem margin-top:1.5rem bg-black fg-white border-radius:6px font-size:14px font-semibold" href="https://css.master.co">
          Open Master CSS
        </a>
      </section>
    </main>
  )
}
