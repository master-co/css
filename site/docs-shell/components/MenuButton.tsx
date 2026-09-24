export default function MenuButton({ opened, ...props }: any) {
  return (
    <button {...props}>
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" strokeWidth="1.2" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M4 8l16 0" className='transition:transform|.3s' style={{ transform: opened ? 'translate(-9px,-2px) rotate(-45deg)' : '', transformOrigin: 'top right' }} />
        <path d="M4 16l16 0" className='transition:transform|.3s' style={{ transform: opened ? 'translate(-9px,2px) rotate(45deg)' : '', transformOrigin: 'bottom right' }} />
      </svg>
    </button>
  )
}
