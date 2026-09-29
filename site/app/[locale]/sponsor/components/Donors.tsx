/* eslint-disable @master/css/sort-classes */
import { Fragment } from 'react'
import Link from '~/site/docs-shell/components/Link'

export default function Donors({ sponsorTiers, sponsorsOfLevel }: any) {
  return sponsorTiers.map((eachSponsorTier: any) => (
    <Fragment key={eachSponsorTier.name}>
      <div className="display:flex align-items:center gap:0.625rem mt-2xl margin-bottom:1.25rem">
        <h2 id={eachSponsorTier.name} className="text-transform:capitalize margin:0!">
          {eachSponsorTier.name}
        </h2>
        <hr className="flex:1|1|auto margin-block:0!" />
      </div>
      { }
      <div className={`align-items:center gap:${eachSponsorTier.gap - 20}px gap:${eachSponsorTier.gap}px@sm grid-cols:${eachSponsorTier.columns}`}>
        {sponsorsOfLevel[eachSponsorTier.name] &&
          sponsorsOfLevel[eachSponsorTier.name].map((eachSponsor: any, i: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={'sponsor-' + i}
              alt={'sponsor-' + i}
              src={eachSponsor.avatarUrl}
              className={`max-height: width:100% height:100% object-fit:contain${eachSponsorTier.height}`}
            />
          ))}
        <Link className="app-object app-object-interactive width:100% height:100% aspect-ratio:1/1 flex-direction:column border-radius:5px" href="#become-a-sponsor">
          <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="currentColor">
            <path d="M0 0h24v24H0V0z" fill="none" />
            <path d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1z" />
          </svg>
        </Link>
      </div>
    </Fragment>
  ))
}
