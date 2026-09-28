import styles from './probe.module.css'
import Link from 'next/link'

export default function Page() {
  return <main className={styles.probe}>Module stylesheet probe <Link href="/other" prefetch={false}>Other route</Link></main>
}
