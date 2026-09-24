export default function Home() {
  return (
    <main className="min-h:100vh p:2.5rem bg-surface-base fg-strong font-sans">
      <section className="max-w:720px mx:auto">
        <p className="font-size:14px fg-primary mb:0.5rem">Next.js Adapter API</p>
        <h1 className="font-size:48px font-heavy tracking-tight">Master CSS pre-rendered by Next build</h1>
        <p className="font-size:20px line-height:1.5 mt:1rem fg-slate">
          This page is statically rendered by Next.js, then processed by the Master CSS adapter.
        </p>
        <a className="inline-flex align-items:center h:44px px:1.25rem mt:1.5rem bg-black fg-white r:6px font-size:14px font-semibold" href="https://css.master.co">
          Open Master CSS
        </a>
      </section>
    </main>
  )
}
