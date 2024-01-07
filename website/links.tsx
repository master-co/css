import { IconComponents, IconFileText, IconRoad, IconSourceCode, IconWriting } from '@tabler/icons-react'

const links = [
    { name: 'Docs', fullName: 'Documentation', href: '/docs', Icon: IconFileText },
    { name: 'Play', href: '/play', Icon: IconSourceCode },
    { name: 'Roadmap', href: '/roadmap', Icon: IconRoad },
    // { name: 'Blog', href: '/blog', disabled: true, Icon: IconWriting },
    { name: 'Components', href: '/components', Icon: IconComponents, disabled: true },
    // { name: 'Templates', href: '/templates', disabled: true }
]

export default links