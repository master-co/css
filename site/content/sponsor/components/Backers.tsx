import Image from '~/site/docs-shell/components/Image'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'

const sourceIcons: Record<string, string> = {
  'Open Collective': '/images/open-collective.svg',
  'Github Sponsors': '/images/github-sponsors.svg'
}

export default function Backers({ backers }: any) {
  const $ = useTranslation()
  if (backers.length === 0) return null
  return <div className="sponsor-backers">
    {backers.map((eachBacker: any, i: number) => {
      let href = eachBacker.websiteUrl || eachBacker.twitterUrl || eachBacker.githubUrl
      if (href && !href?.startsWith('http://') && !href?.startsWith('https://')) {
        // 如果沒有，根據需要自動加上
        href = 'https://' + href // 或是 "http://" + url;
      }
      const className = 'sponsor-backer'
      const sourceIcon = sourceIcons[eachBacker.from]
      const Avatar = () =>
        <>
          <Image src={eachBacker.avatarUrl} alt={eachBacker.name || eachBacker.username || 'Supporter'} className="height:100% width:100% aspect-ratio:1/1 border-radius:50% object-fit:cover" width="64" height="64" />
          {sourceIcon && <div className="position:absolute bottom:-3px right:-3px height:22px width:22px aspect-ratio:1/1 p-4xs border-radius:50% bg-surface-raised">
            <Image src={sourceIcon} alt="" width="18" height="18" />
          </div>}
        </>
      return (
        href
          ? <Link key={'backer-' + i} href={href} className={className}><Avatar /></Link>
          : <div key={'backer-' + i} className={className}><Avatar /></div>
      )
    })}
    <Link href="#become-a-backer" className="sponsor-backer-add" aria-label={$('Become a backer')}>
      <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="currentColor">
        <path d="M0 0h24v24H0V0z" fill="none" />
        <path d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1z" />
      </svg>
    </Link>
  </div>
}
