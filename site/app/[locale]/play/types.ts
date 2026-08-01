export interface PlayFile {
  title?: string
  name?: string
  language?: 'html' | 'javascript' | 'css' | 'plaintext'
  content?: string
  id?: string
  readOnly?: boolean
}

export interface PlayProps {
  shareId?: string
}

export interface PlayPreviewContent {
  html: string
  css: string
}

export interface PlayErrorEvent {
  type: 'error'
  lineno: number
  message: string
  filename: string
  datetime: Date
}
