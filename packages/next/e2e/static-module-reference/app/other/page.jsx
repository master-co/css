import Link from 'next/link'
import styles from './other.module.css'

export default function OtherPage() {
  return <main className={styles.other}>Second Module probe <Link href="/" prefetch={false}>Home route</Link></main>
}
