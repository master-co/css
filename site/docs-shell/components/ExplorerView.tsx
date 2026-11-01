import FileIcon from './FileIcon'
import FolderSvg from '../../public/icons/folder.svg'

declare type ExplorerViewItemOption = {
  name: string;
  children: ExplorerViewItemOption[];
}

/** A file tree (`ui-tree`): names in mono, nested folders on hairline guides. */
export default function ExplorerView({ children }: { children: ExplorerViewItemOption[] }) {
  const Items = ({ options }: { options: ExplorerViewItemOption[] }) => (
    <ul>
      {options.map((option, index) => {
        const ext = option.name.includes('.') ? option.name.split('.').pop() : ''
        return (
          <li key={option.name + index}>
            <div>
              {ext ? <FileIcon name={option.name} ext={ext} aria-hidden="true" /> : <FolderSvg aria-hidden="true" />}
              <b>{option.name}</b>
            </div>
            {option.children?.length ? <Items options={option.children} /> : null}
          </li>
        )
      })}
    </ul>
  )
  return <div className="ui-tree"><Items options={children} /></div>
}
