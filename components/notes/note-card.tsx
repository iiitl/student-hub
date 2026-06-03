'use client'
import React, { useState, useEffect } from 'react'
import { Download, Eye, Trash2, Edit, Info } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TypeNote } from '@/types/note'

type NoteCardProps = {
  note: TypeNote
  onDelete?: () => void
}

const NoteCard = ({ note, onDelete }: NoteCardProps) => {
  const { data: session } = useSession()
  const router = useRouter()
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    if (session?.user) {
      const userId = session.user.id
      const userEmail = session.user.email
      const isUploader = note.uploadedBy === userId
      const isTechnicalClub = userEmail === 'technicalclub@iiitl.ac.in'
      setCanEdit(isUploader || isTechnicalClub)
    }
  }, [session, note.uploadedBy])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = note.url
    link.download =
      note.fileName || `${note.subject}_${note.exam}_${note.batch}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleView = () => {
    window.open(note.viewUrl || note.url, '_blank')
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return
    try {
      const response = await fetch(`/api/notes?id=${note.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        if (onDelete) onDelete()
      } else {
        const data = await response.json()
        alert(data.message || 'Failed to delete note')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete note')
    }
  }

  const handleEdit = () => {
    router.push(`/notes/edit/${note.id}`)
  }

  const isAxios = note.category === 'axios'

  return (
    <div
      className={`w-full flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border-l-4 border border-border bg-muted/50 hover:bg-muted transition-all duration-200 shadow-sm hover:shadow-md cursor-default
        ${isAxios ? 'border-l-violet-500' : 'border-l-primary'}`}
    >
      {/* Subject + Faculty */}
      <div className="flex-1 min-w-0">
        <h3
          className="font-semibold text-base sm:text-xl leading-tight truncate"
          title={note.subject}
        >
          {note.subject}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
          Faculty:{' '}
          <span className="text-foreground">{note.facultyName || 'N/A'}</span>
          {note.description && (
            <>
              {' '}
              · <span className="italic">{note.description}</span>
            </>
          )}
        </p>
      </div>

      {/* Meta badges */}
      <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
        <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium bg-background border border-border text-muted-foreground">
          Sem {note.semester}
        </span>
        <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium bg-background border border-border text-muted-foreground">
          {note.exam}
        </span>
        <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium bg-background border border-border text-muted-foreground">
          {note.batch}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Info tooltip */}
        <div className="relative group">
          <button
            className="cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent p-2 rounded-full transition-colors duration-200 flex items-center justify-center"
            aria-label="Info"
          >
            <Info className="h-4 w-4" />
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-popover text-popover-foreground text-sm rounded-md shadow-md border z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
            <div className="font-semibold mb-1">
              Faculty: {note.facultyName || 'N/A'}
            </div>
            <div className="text-muted-foreground text-xs">
              {note.description || 'No description available'}
            </div>
            {note.fileName && (
              <div className="text-muted-foreground text-xs mt-1">
                File: {note.fileName}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="cursor-pointer bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center"
          aria-label={`Download ${note.subject} note`}
          title="Download"
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          onClick={handleView}
          className="cursor-pointer bg-green-500 text-white px-3 py-1.5 rounded hover:bg-green-600 transition-colors duration-200 flex items-center justify-center"
          aria-label={`View ${note.subject} note`}
          title="View"
        >
          <Eye className="h-4 w-4" />
        </button>
        {canEdit && (
          <>
            <button
              onClick={handleEdit}
              className="cursor-pointer bg-yellow-500 text-white px-3 py-1.5 rounded hover:bg-yellow-600 transition-colors duration-200 flex items-center justify-center"
              aria-label={`Edit ${note.subject} note`}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="cursor-pointer bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 transition-colors duration-200 flex items-center justify-center"
              aria-label={`Delete ${note.subject} note`}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default NoteCard
