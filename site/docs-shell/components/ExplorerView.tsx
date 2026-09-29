import '~/site/styles/docs-shell/code.css'
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
      <div className='display:flex flex-direction:column width:100%'>
        <div className='display:flex align-items:center'>
          {ext && <FileIcon name={option.name} ext={ext} className="height:1.2em width:1.2em mr-3xs" />}
          {!ext && <FolderSvg className="height:1.2em width:1.2em mr-3xs" />}
          {option.name}
        </div>
        {option.children?.length &&
          <div className='margin-left:1.5em'>
            {option.children.map((option, index) => <Item {...option} key={option.name + index} />)}
          </div>
        }
      </div>
    )
  }
  return (
    <div className='code-wrapper'>
      <div className="padding-inline:1.25rem fg-text-strong code-block">
        {children.map((option, index) => (
          <Item {...option} key={option.name + index} />
        ))}
      </div>
    </div>
  )
}