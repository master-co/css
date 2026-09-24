import aronImage from '../../public/images/authors/aron.jpg'
import lolaImage from '../../public/images/authors/lola.jpg'
import milesImage from '../../public/images/authors/miles.jpg'
import benseageImage from '../../public/images/authors/benseage.jpg'
import joyImage from '../../public/images/authors/joy.jpg'

import type { StaticImageData } from 'next/image'

const authors: { name: string, image: StaticImageData, url: string, twitter: string }[] = [
  { name: 'Aron', image: aronImage, url: 'https://github.com/1aron', twitter: '@aron1tw' },
  { name: 'Lola', image: lolaImage, url: 'https://github.com/0lola', twitter: '@0lolatw' },
  { name: 'Miles', image: milesImage, url: 'https://github.com/0miles', twitter: '@milestw' },
  { name: 'BenSeage', image: benseageImage, url: 'https://github.com/benseage', twitter: '@benseage' },
  { name: 'Joy', image: joyImage, url: 'https://github.com/0joy0', twitter: '@joyhe71' },
]

export default authors