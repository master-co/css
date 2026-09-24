import clsx from 'clsx'
import Link from './Link'

export default function ArticleTOC({ data }: { data: [] }) {
  const renderNestedList = (items: any[]) => {
    return (
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link href={'#' + item.id}>{item.title}</Link>
          </li>
        ))}
      </ul>
    )
  }
  const buildNestedStructure = (data: any[]) => {
    const nestedData: any[] = []

    // Group items by their parent level 2 item
    const parentMap = new Map()
    data.forEach((item) => {
      if (item.level === 2) {
        parentMap.set(item.id, { ...item, children: [] })
      } else {
        const parent = Array.from(parentMap.values()).pop()
        parent.children.push(item)
      }
    })

    // Build the nested structure
    parentMap.forEach((parent) => {
      nestedData.push(parent)
    })

    return nestedData
  }

  const nestedData = buildNestedStructure(data)

  return <div className='my:2em'>{renderNestedList(nestedData)}</div>
}
