import Link from './Link'

/** A primary section link; it is current anywhere inside its section. */
export default function HeaderNav({ name, children, isNew, ...props }: any) {
  return (
    <Link {...props} key={name} current="true" ambiguous>
      {children}
    </Link>
  )
}
