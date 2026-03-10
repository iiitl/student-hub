'use client'
import React, { useEffect, useState } from 'react'
import NoteCard from '@/components/notes/note-card'
import { TypeNote } from '@/types/note'
import PaperFilterDropdown from '@/components/papers/paper-filter-dropdown'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Notes = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedBatch, setSelectedBatch] = useState<string>('All')
  const [selectedSemester, setSelectedSemester] = useState<string>('All')
  const [selectedExam, setSelectedExam] = useState<string>('All')
  const [selectedSubject, setSelectedSubject] = useState<string>('All')

  const [allNotes, setAllNotes] = useState<TypeNote[]>([])
  const [userNotes, setUserNotes] = useState<TypeNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [batches, setBatches] = useState<string[]>(['All'])
  const [semesters, setSemesters] = useState<string[]>(['All'])
  const [subjects, setSubjects] = useState<string[]>(['All'])
  const [exams, setExams] = useState<string[]>(['Mid', 'End', 'All'])

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/notes?limit=1000') // Fetch all notes
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch notes')
      }

      const transformedNotes: TypeNote[] = data.notes.notes.map(
        (note: {
          subject?: string
          facultyName: string
          content?: string
          year: number
          semester?: string
          term: string
          document_url: string
          file_name: string
          file_type: string
          _id: string
          uploaded_by: string
        }) => ({
          subject: note.subject || 'Unknown',
          subjectCode: note.subject || 'Unknown',
          batch: note.year || new Date().getFullYear(),
          semester: note.semester || extractSemesterNumber(note.term),
          exam: normalizeExamType(note.term),
          url: note.document_url,
          viewUrl: note.document_url,
          fileName: note.file_name,
          fileType: note.file_type,
          id: note._id.toString(),
          uploadedBy: note.uploaded_by,
          description: note.content,
          facultyName: note.facultyName,
        })
      )

      setAllNotes(transformedNotes)
      setUserNotes(transformedNotes)

      const uniqueSubjects = [
        ...new Set(transformedNotes.map((note) => note.subject)),
      ].sort()
      setSubjects([...uniqueSubjects, 'All'])

      const uniqueBatches = [
        ...new Set(
          transformedNotes.map((note) =>
            (note.batch || new Date().getFullYear()).toString()
          )
        ),
      ].sort((a, b) => Number(b) - Number(a))
      setBatches([...uniqueBatches, 'All'])

      const uniqueSemesters = [
        ...new Set(transformedNotes.map((note) => note.semester.toString())),
      ].sort((a, b) => Number(a) - Number(b))
      setSemesters([...uniqueSemesters, 'All'])
    } catch (err) {
      console.error('Error fetching notes:', err)
      setError(err instanceof Error ? err.message : 'Failed to load notes')
    } finally {
      setIsLoading(false)
    }
  }

  const extractSemesterNumber = (
    term: string
  ): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 => {
    const match = term.match(/semester[- ]?(\d)/i)
    if (match) {
      const num = parseInt(match[1])
      if (num >= 1 && num <= 8) return num as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    }
    return 1 // Default fallback
  }

  const normalizeExamType = (term: string): 'Mid' | 'End' | 'Both' => {
    const lowerTerm = term.toLowerCase()
    if (lowerTerm.includes('mid')) return 'Mid'
    if (lowerTerm.includes('end')) return 'End'
    return 'Mid'
  }

  useEffect(() => {
    const filteredNotes = allNotes.filter((note: TypeNote) => {
      if (
        selectedBatch !== 'All' &&
        (note.batch || new Date().getFullYear()).toString() !== selectedBatch
      )
        return false
      if (
        selectedSemester !== 'All' &&
        note.semester.toString() !== selectedSemester
      )
        return false
      if (selectedSubject !== 'All' && note.subject !== selectedSubject)
        return false
      if (selectedExam !== 'All' && note.exam !== selectedExam) return false
      return true
    })
    setUserNotes(filteredNotes)
  }, [selectedBatch, selectedSemester, selectedSubject, selectedExam, allNotes])

  const handleNoteDeleted = () => {
    fetchNotes()
  }

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="flex flex-col sm:flex-row sm:relative sm:justify-center items-center w-full max-w-7xl px-5 mt-6 mb-2 gap-3 sm:gap-0">
        <h1 className="text-3xl font-semibold text-center">Notes</h1>
        <Button
          onClick={() => router.push('/upload-notes')}
          className="sm:absolute sm:right-5 flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Note
        </Button>
      </div>
      <div className="flex justify-center items-center gap-5 flex-wrap w-full px-5 py-3">
        <div className="flex items-center gap-4">
          <h3 className="text-lg">Subject</h3>
          <PaperFilterDropdown
            title="Subjects"
            variable={selectedSubject}
            setVariable={setSelectedSubject}
            variableArray={subjects}
          />
        </div>
        <div className="flex items-center gap-4">
          <h3 className="text-lg">Batch</h3>
          <PaperFilterDropdown
            title="Batches"
            variable={selectedBatch}
            setVariable={setSelectedBatch}
            variableArray={batches}
          />
        </div>
        <div className="flex items-center gap-4">
          <h3 className="text-lg">Semester</h3>
          <PaperFilterDropdown
            title="Semesters"
            variable={selectedSemester}
            setVariable={setSelectedSemester}
            variableArray={semesters}
          />
        </div>
        <div className="flex items-center gap-4">
          <h3 className="text-lg">Exam Type</h3>
          <PaperFilterDropdown
            title="Exams"
            variable={selectedExam}
            setVariable={setSelectedExam}
            variableArray={exams}
          />
        </div>
      </div>
      <div className="container flex flex-col py-5 px-3 gap-3 items-center justify-center">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg">Loading notes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-lg text-red-500 mb-4">{error}</p>
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : userNotes.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg">No notes found matching your filters.</p>
            <button
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
              onClick={() => {
                setSelectedBatch('All')
                setSelectedSemester('All')
                setSelectedExam('All')
                setSelectedSubject('All')
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          userNotes.map((note: TypeNote, index) => (
            <div
              key={`${note.subject}-${note.batch}-${note.exam}-${note.semester}-${index}`}
              className="w-full"
            >
              <NoteCard note={note} onDelete={handleNoteDeleted} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Notes
