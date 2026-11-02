/** Publication copy and photography shared by the live journal, token card and release artwork. */
export const publication = {
  name: 'Fieldwork',
  issue: '04',
  tagline: 'Good spaces. Considered living.',
  introduction: 'Thoughtful spaces and useful objects. A little less, made with care.'
} as const

export const leadStory = {
  title: 'The everyday, considered.',
  category: 'Spaces / Quiet interiors',
  description: 'On slowing down, looking closer, and finding a little more in the spaces we inhabit.',
  image: {
    src: '/images/blog/v2/white-oak-room.webp',
    original: '/images/blog/v2/white-oak-room.jpg',
    alt: 'White oak chairs and a dining table beside sheer linen curtains',
    width: 1672,
    height: 941
  },
  paragraphs: [
    'Morning light moves across the oak table. A cup, a book, a chair pulled close. The room asks for very little, and gives something back: space to read, to think, to begin again.',
    'Its character lives in small decisions. The soft edge of a tabletop. Linen that lets the light through. A place for the objects we reach for every day. Nothing needs to compete for attention.',
    'A good home makes room for the everyday.'
  ]
} as const

export const objectStory = {
  title: 'Room to make something.',
  category: '02 / Objects',
  image: {
    src: '/images/blog/v2/ceramic-study.webp',
    original: '/images/blog/v2/ceramic-study.jpg',
    alt: 'A ceramic pitcher and bowl on a white oak table',
    width: 1536,
    height: 1024
  },
  body: 'Clay keeps a record of the hand. A slightly uneven rim, a glaze that settles into the surface, a handle shaped to be held. Useful objects can make a daily ritual feel considered.'
} as const

export const practiceStory = {
  title: 'The things we choose to keep.',
  category: '03 / In practice',
  body: 'A room takes shape through what stays. Start with the pieces you use, give each one a place, and leave a little space between them. The goal is a home that works for the life inside it.'
} as const
