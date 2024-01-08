import Image from 'next/image'
import styles from './page.module.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
    return (
        <main className={styles.main}>
            <div className={styles.description}>
                <p>
                    Get started by editing&nbsp;
                    <code className={styles.code}>app/page.tsx</code>
                </p>
                <div>
                    <a
                        href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        By{' '}
                        <Image
                            src="/vercel.svg"
                            alt="Vercel Logo"
                            className={styles.vercelLogo}
                            width={100}
                            height={24}
                            priority
                        />
                    </a>
                </div>
            </div>

            <div className={styles.center}>
                <Image
                    className={styles.logo}
                    src="/next.svg"
                    alt="Next.js Logo"
                    width={180}
                    height={37}
                    priority
                />
                <div className={styles.thirteen}>
                    <Image src="/thirteen.svg" alt="13" width={40} height={31} priority />
                </div>
                <Image
                    className={'rel ml:80 mr:5 block@media(prefers-color-scheme:dark)'}
                    src="/css-logotype@dark.svg"
                    alt="Master CSS Logo"
                    width={380}
                    height={48}
                    priority
                    hidden
                />
                <Image
                    className={'rel ml:80 mr:5 block@media(prefers-color-scheme:light)'}
                    src="/css-logotype@light.svg"
                    alt="Master CSS Logo"
                    width={380}
                    height={48}
                    priority
                    hidden
                />
                <div className={styles.thirteen + ' font:40 font:bold ' + inter.className}>
                    2
                </div>
            </div>

            <div className={styles.grid}>
                <a
                    href="https://rc.nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
                    className={styles.card}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <h2 className={inter.className}>
                        Docs <span>-&gt;</span>
                    </h2>
                    <p className={inter.className}>Find in-depth information about Next.js features and API.</p>
                </a>

                <a
                    href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
                    className={styles.card}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <h2 className={inter.className}>
                        Learn <span>-&gt;</span>
                    </h2>
                    <p className={inter.className}>Learn about Next.js in an interactive course with&nbsp;quizzes!</p>
                </a>

                <a
                    href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
                    className={styles.card}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <h2 className={inter.className}>
                        Templates <span>-&gt;</span>
                    </h2>
                    <p className={inter.className}>Explore the Next.js 13 playground.</p>
                </a>

                <a
                    href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
                    className={styles.card}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <h2 className={inter.className}>
                        Deploy <span>-&gt;</span>
                    </h2>
                    <p className={inter.className}>
                        Instantly deploy your Next.js site to a shareable URL with Vercel.
                    </p>
                </a>
            </div>
        </main>
    )
}
