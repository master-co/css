/* eslint-disable @next/next/no-img-element */
import { FC, ImgHTMLAttributes } from 'react'

/* eslint-disable jsx-a11y/alt-text */
declare type ModeImgProps = ImgHTMLAttributes<HTMLImageElement>

const ModeImg: FC<ModeImgProps> = (props) => {
  return (
    <>
      <img {...props} className='hidden@dark' />
      <img {...props} src={(props.src as string)?.replace(/(\.\w+)$/, '@dark$1')} className='hidden@light' />
    </>
  )
}

export default ModeImg