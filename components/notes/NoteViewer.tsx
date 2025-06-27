'use client'

import { FC } from 'react'

interface NoteViewerProps {
  url: string
}

const NoteViewer: FC<NoteViewerProps> = ({ url }) => {
  return (
    <div className="w-full h-full p-4">
      <iframe
        src={url}
        className="w-full h-[80vh] rounded shadow"
        title="PDF Viewer"
      ></iframe>
    </div>
  )
}

export default NoteViewer
