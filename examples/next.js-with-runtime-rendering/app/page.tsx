import Image from 'next/image'
import styles from './page.module.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
    return (
        <main className={styles.main}>
            <div className="pr:10@supports|selector(::webkit-scrollbar)">

            </div>
        </main>
    )
}
