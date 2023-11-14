import { Fragment } from 'react'
import Link from 'websites/components/Link'

export default function Donors({ sponsorTiers, sponsorsOfLevel }: any) {
    return sponsorTiers.map((eachSponsorTier: any) => (
        <Fragment key={eachSponsorTier.name}>
            <div className="flex align-items:center gap:10 mb:30 mt:80">
                <h2 id={eachSponsorTier.name} className="capitalize m:0!">
                    {eachSponsorTier.name}
                </h2>
                <hr className="flex:1|1|auto my:0!" />
            </div>
            <div className={`grid-cols:${eachSponsorTier.columns} gap:${eachSponsorTier.gap - 20} gap:${eachSponsorTier.gap}@sm align-items:center`}>
                {sponsorsOfLevel[eachSponsorTier.name] &&
                    sponsorsOfLevel[eachSponsorTier.name].map((eachSponsor: any, i: number) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            key={'sponsor-' + i}
                            alt={'sponsor-' + i}
                            src={eachSponsor.avatarUrl}
                            className={`max-h: full object:contain${eachSponsorTier.height}`}
                        />
                    ))}
                <Link className="app-object app-object-interactive full aspect:1/1 flex:col r:5" href="#become-a-sponsor">
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="currentColor">
                        <path d="M0 0h24v24H0V0z" fill="none" />
                        <path d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1z" />
                    </svg>
                </Link>
            </div>
        </Fragment>
    ))
}