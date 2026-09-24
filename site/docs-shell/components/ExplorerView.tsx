import FileIcon from './FileIcon'
import FolderSvg from '../../public/icons/folder.svg'

declare type ExplorerViewItemOption = {
  name: string;
  children: ExplorerViewItemOption[];
}

export default function ExplorerView({ children }: { children: ExplorerViewItemOption[] }) {
  const Item = (option: ExplorerViewItemOption) => {
    const ext = option.name.includes('.')
      ? option.name.split('.').pop()
      : ''
    return (
      <div className='flex flex-col w:100%'>
        <div className='flex items-center'>
          {ext && <FileIcon name={option.name} ext={ext} className="size:1.2em mr-3xs" />}
          {!ext && <FolderSvg className="size:1.2em mr-3xs" />}
          {option.name}
        </div>
        {option.children?.length &&
          <div className='ml:1.5em'>
            {option.children.map((option, index) => <Item {...option} key={option.name + index} />)}
          </div>
        }
      </div>
    )
  }
  return (
    <div className='code-wrapper'>
      <div className="px:1.25rem text-strong code-block">
        {children.map((option, index) => (
          <Item {...option} key={option.name + index} />
        ))}
      </div>
    </div>
  )
}