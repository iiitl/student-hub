'use client'

import React, { FC, useState, useEffect } from 'react'

interface NoteViewerProps {
  url: string
}

const NoteViewer: FC<NoteViewerProps> = ({ url }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setError(true)
        setLoading(false)
      }
    }, 30000) // 30 second timeout

    return () => clearTimeout(timer)
  }, [loading])

  if (error) {
    return (
      <div className="w-full h-full p-4 flex items-center justify-center">
        <p className="text-red-500">Failed to load PDF. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full p-4">
      {loading && (
        <p className="text-center text-muted-foreground animate-pulse">
          Loading PDF...
        </p>
      )}
      <iframe
        src={url}
        className="w-full h-[80vh] rounded shadow"
        title="PDF Viewer"
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
        role="application"
        aria-label={`PDF document viewer for ${url.split('/').pop()}`}
      ></iframe>
    </div>
  )
}

export default NoteViewer
