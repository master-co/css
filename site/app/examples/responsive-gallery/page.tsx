import Image from 'next/image'
import mountain1 from '~/site/public/images/mountain1.jpg'
import mountain2 from '~/site/public/images/mountain2.jpg'
import mountain3 from '~/site/public/images/mountain3.jpg'
import mountain4 from '~/site/public/images/mountain4.jpg'
import mountain5 from '~/site/public/images/mountain5.jpg'
import mountain6 from '~/site/public/images/mountain6.jpg'
import mountain7 from '~/site/public/images/mountain7.jpg'
import mountain8 from '~/site/public/images/mountain8.jpg'
import mountain9 from '~/site/public/images/mountain9.jpg'
import mountain10 from '~/site/public/images/mountain10.jpg'
import mountain11 from '~/site/public/images/mountain11.jpg'
import mountain12 from '~/site/public/images/mountain12.jpg'

const mountains = [
  [mountain2, 'Snowy pyramid peak above the clouds'],
  [mountain3, 'Snow-covered ridges beneath a starry sky'],
  [mountain4, 'Moon above a forested mountain range at dusk'],
  [mountain5, 'Rocky towers above a green alpine valley'],
  [mountain6, 'Jagged rock spires beneath heavy clouds'],
  [mountain7, 'Monochrome snow-covered peaks'],
  [mountain8, 'Green volcanic slopes wrapped in clouds'],
  [mountain9, 'Snowy summit beneath a pink sky'],
  [mountain10, 'Mountain range reflected across a lake'],
  [mountain11, 'Dark ridges fading into low cloud'],
  [mountain12, 'Grassy alpine ridge beneath a broad sky'],
] as const

export const dynamic = 'force-static'
export const revalidate = false

export default function Page() {
  return <main className="min-h:100dvh p-md bg-demo-canvas text-body">
    <header className="flex items-baseline justify-between gap-md mb-md">
      <h1 className="m:0 text-sm font-semibold">Field notes</h1>
      <span className="demo-label">12 images / landscape</span>
    </header>
    <div data-gallery className="grid-cols:2 gap-md grid-cols:3@2xs grid-cols:4@sm grid-cols:5@md">
      <Image className="grid-col-span:2 grid-row-span:2 full min-h:0 r-sm object-cover"
        src={mountain1} placeholder="blur" sizes="(min-width:1024px) 40vw, (min-width:834px) 50vw, (min-width:600px) 66vw, 100vw"
        alt="Snowy peaks emerging from a sea of clouds" />
      {mountains.map(([mountain, alt]) => <Image key={mountain.src}
        className="h:auto w:100% aspect-ratio:2/1 r-sm object-cover"
        src={mountain} placeholder="blur" sizes="(min-width:1024px) 20vw, (min-width:834px) 25vw, (min-width:600px) 33vw, 50vw" alt={alt} />)}
    </div>
  </main>
}
