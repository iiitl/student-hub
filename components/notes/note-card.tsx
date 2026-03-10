'use client'
import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
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
    if (note.viewUrl) {
      window.open(note.viewUrl, '_blank')
    } else {
      window.open(note.url, '_blank')
    }
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

  return (
    <Card className="w-full flex flex-col md:flex-row p-4 justify-between items-start md:items-center bg-border/20 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
      <h2 className="text-xl truncate w-full" title={note.subject}>
        {note.subject}
      </h2>
      <div className="flex flex-row-reverse shrink-0 md:flex-row justify-center items-center gap-4">
        <p className="text-foreground">
          {note.batch} - {note.exam} Semester {note.semester}
        </p>

        {/* Info Button with Tooltip */}
        <div className="relative group">
          <button
            className="cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/50 p-2 rounded-full transition-colors duration-200 flex items-center justify-center"
            aria-label="Info"
          >
            <Info className="h-5 w-5" />
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-popover text-popover-foreground text-sm rounded-md shadow-md border z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
            <div className="font-semibold mb-1">
              Faculty: {note.facultyName || 'N/A'}
            </div>
            <div className="text-muted-foreground text-xs">
              {note.description || 'No description available'}
            </div>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center"
          aria-label={`Download ${note.subject} note`}
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          onClick={handleView}
          className="cursor-pointer bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200 flex items-center justify-center"
          aria-label={`View ${note.subject} note`}
        >
          <Eye className="h-4 w-4" />
        </button>
        {canEdit && (
          <>
            <button
              onClick={handleEdit}
              className="cursor-pointer bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors duration-200 flex items-center justify-center"
              aria-label={`Edit ${note.subject} note`}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="cursor-pointer bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors duration-200 flex items-center justify-center"
              aria-label={`Delete ${note.subject} note`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </Card>
  )
}

export default NoteCard
