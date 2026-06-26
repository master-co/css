export default function Home() {
    return (
        <main className="min-h:100vh p:10x bg:surface-base fg:strong font:sans">
            <section className="max-w:720px mx:auto">
                <p className="text:14px fg:primary mb:2x">Next.js Adapter API</p>
                <h1 className="font:48px font:heavy tracking:tight">Master CSS pre-rendered by Next build</h1>
                <p className="font:20px line-height:1.5 mt:4x fg:slate">
                    This page is statically rendered by Next.js, then processed by the Master CSS adapter.
                </p>
                <a className="inline-flex align-items:center h:44px px:5x mt:6x bg:black fg:white r:6px text:14px font:semibold" href="https://css.master.co">
                    Open Master CSS
                </a>
            </section>
        </main>
    )
}
