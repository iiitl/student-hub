'use client'

import { useState } from 'react'
import SidebarFolderTree from '@/components/notes/SidebarFolderTree'
import NoteViewer from '@/components/notes/NoteViewer'
import { notesTree, notesContent } from '@/data/mock_notes'

export default function NotesPage() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  const handleNoteClick = (id: string | null) => {
    setSelectedNoteId(prevId => (prevId === id ? null : id))
  }

  const selectedNote = selectedNoteId ? notesContent[selectedNoteId] : null

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-background p-4 overflow-auto">
        <SidebarFolderTree
  onNoteClick={handleNoteClick}
  activeNoteId={selectedNoteId}/>

      </aside>

      <main className="flex-1 p-4 overflow-auto">
        {selectedNote ? (
          selectedNote.type === 'pdf' ? (
            <NoteViewer url={selectedNote.url} />
          ) : (
            <p>Unsupported note type</p>
          )
        ) : (
          <p className="text-muted-foreground">Select a note to view</p>
        )}
      </main>
    </div>
  )
}
