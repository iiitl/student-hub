'use client'
import React, { useEffect, useState, useMemo } from 'react'
import NoteCard from '@/components/notes/note-card'
import { TypeNote, NoteCategory, AxiosWing, AxiosAudience } from '@/types/note'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  BookOpen,
  Code2,
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

/* ─── Category config ── */
const CATEGORIES: {
  id: NoteCategory
  label: string
  subtitle: string
  icon: React.ReactNode
}[] = [
  {
    id: 'academic',
    label: 'Academic Notes',
    subtitle: 'University study material, lecture notes & past papers',
    icon: <GraduationCap className="w-5 h-5" />,
  },
  {
    id: 'axios',
    label: 'Axios — Technical Club',
    subtitle: 'Resources, workshops & materials by the Tech Club',
    icon: <Code2 className="w-5 h-5" />,
  },
]

/* ─── Simple filter dropdown using theme tokens ── */
interface FilterDropdownProps {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}

const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
}: FilterDropdownProps) => {
  const [open, setOpen] = useState(false)
  const isSet = value !== 'All'
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors duration-150
          ${
            isSet
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
      >
        <span>{isSet ? value : label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 min-w-max rounded-md border border-border bg-popover text-popover-foreground shadow-md overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
              className={`flex w-full items-center px-4 py-2 text-sm text-left transition-colors
                ${
                  opt === value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted'
                }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const Notes = () => {
  useSession()
  const router = useRouter()

  const [activeCategory, setActiveCategory] = useState<NoteCategory>('academic')
  const [allNotes, setAllNotes] = useState<TypeNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('All')
  const [selectedSemester, setSelectedSemester] = useState('All')
  const [selectedExam, setSelectedExam] = useState('All')
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [selectedWing, setSelectedWing] = useState('All')
  const [selectedAudience, setSelectedAudience] = useState('All')
  const [showFilters, setShowFilters] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchNotes()
  }, [])

  type RawNote = {
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
    category?: string
    wing?: AxiosWing
    targetAudience?: AxiosAudience
    presenterName?: string
  }

  const transformNote = (note: RawNote): TypeNote => ({
    subject: note.subject || 'Unknown',
    subjectCode: note.subject || 'Unknown',
    batch: note.year || new Date().getFullYear(),
    semester: note.semester
      ? (parseInt(note.semester) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8)
      : extractSemesterNumber(note.term),
    exam: normalizeExamType(note.term),
    url: note.document_url,
    viewUrl: note.document_url,
    fileName: note.file_name,
    fileType: note.file_type,
    id: note._id.toString(),
    uploadedBy: note.uploaded_by,
    description: note.content,
    facultyName: note.facultyName,
    category: (note.category === 'axios'
      ? 'axios'
      : 'academic') as NoteCategory,
    wing: note.wing,
    targetAudience: note.targetAudience,
    presenterName: note.presenterName,
  })

  const fetchNotes = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const PAGE_SIZE = 100
      let page = 1
      let hasNextPage = true
      const collected: TypeNote[] = []

      // Loop through every page until the collection is exhausted
      while (hasNextPage) {
        const response = await fetch(
          `/api/notes?limit=${PAGE_SIZE}&page=${page}`
        )
        const data = await response.json()
        if (!response.ok)
          throw new Error(data.message || 'Failed to fetch notes')

        const pageNotes: TypeNote[] = (data.notes.notes as RawNote[]).map(
          transformNote
        )
        collected.push(...pageNotes)

        hasNextPage = data.notes.hasNextPage ?? false
        page += 1
      }

      setAllNotes(collected)
    } catch (err) {
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
    return 1
  }

  const normalizeExamType = (term: string): 'Mid' | 'End' | 'Both' => {
    const t = term.toLowerCase()
    if (t.includes('end')) return 'End'
    if (t.includes('mid')) return 'Mid'
    return 'Mid'
  }

  const clearFilters = () => {
    setSelectedBatch('All')
    setSelectedSemester('All')
    setSelectedSubject('All')
    setSelectedExam('All')
    setSelectedWing('All')
    setSelectedAudience('All')
    setSearchQuery('')
  }

  useEffect(() => {
    clearFilters()
  }, [activeCategory])

  const categoryNotes = useMemo(
    () => allNotes.filter((n) => n.category === activeCategory),
    [allNotes, activeCategory]
  )

  const subjects = useMemo(
    () => ['All', ...[...new Set(categoryNotes.map((n) => n.subject))].sort()],
    [categoryNotes]
  )
  const batches = useMemo(
    () => [
      'All',
      ...[...new Set(categoryNotes.map((n) => n.batch.toString()))].sort(
        (a, b) => Number(b) - Number(a)
      ),
    ],
    [categoryNotes]
  )
  const semesters = useMemo(
    () => [
      'All',
      ...[...new Set(categoryNotes.map((n) => n.semester.toString()))].sort(
        (a, b) => Number(a) - Number(b)
      ),
    ],
    [categoryNotes]
  )
  const exams = ['All', 'Mid', 'End']

  const wings = useMemo(
    () => [
      'All',
      ...[
        ...new Set(categoryNotes.map((n) => n.wing || '').filter(Boolean)),
      ].sort(),
    ],
    [categoryNotes]
  )

  const audiences = useMemo(
    () => [
      'All',
      ...[
        ...new Set(
          categoryNotes.map((n) => n.targetAudience || '').filter(Boolean)
        ),
      ].sort(),
    ],
    [categoryNotes]
  )

  const filteredNotes = useMemo(() => {
    return categoryNotes.filter((note) => {
      if (activeCategory === 'academic') {
        if (selectedBatch !== 'All' && note.batch.toString() !== selectedBatch)
          return false
        if (
          selectedSemester !== 'All' &&
          note.semester.toString() !== selectedSemester
        )
          return false
        if (selectedExam !== 'All' && note.exam !== selectedExam) return false
      } else if (activeCategory === 'axios') {
        if (selectedWing !== 'All' && note.wing !== selectedWing) return false
        if (
          selectedAudience !== 'All' &&
          note.targetAudience !== selectedAudience
        )
          return false
      }

      if (selectedSubject !== 'All' && note.subject !== selectedSubject)
        return false

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = note.subject.toLowerCase().includes(query)
        const matchFaculty = note.facultyName?.toLowerCase().includes(query)
        const matchDescription = note.description?.toLowerCase().includes(query)
        const matchPresenter = note.presenterName?.toLowerCase().includes(query)
        const matchWing = note.wing?.toLowerCase().includes(query)

        if (
          !matchTitle &&
          !matchFaculty &&
          !matchDescription &&
          !matchPresenter &&
          !matchWing
        ) {
          return false
        }
      }

      return true
    })
  }, [
    categoryNotes,
    selectedBatch,
    selectedSemester,
    selectedSubject,
    selectedExam,
    selectedWing,
    selectedAudience,
    searchQuery,
    activeCategory,
  ])

  const hasActiveFilters =
    selectedBatch !== 'All' ||
    selectedSemester !== 'All' ||
    selectedSubject !== 'All' ||
    selectedExam !== 'All' ||
    selectedWing !== 'All' ||
    selectedAudience !== 'All' ||
    searchQuery.trim() !== ''

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-full px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Notes</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Browse and download notes by category
            </p>
          </div>
          <Button
            onClick={() => router.push('/upload-notes')}
            className="flex items-center gap-2 self-start"
          >
            <Upload className="h-4 w-4" />
            Upload Note
          </Button>
        </div>

        {/* Category tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id
            const count = allNotes.filter((n) => n.category === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-colors duration-150
                  ${
                    isActive
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border bg-card hover:bg-muted text-foreground'
                  }`}
              >
                <div
                  className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {cat.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{cat.label}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium
                      ${isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}
                    >
                      {count}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cat.subtitle}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Search + filter bar */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={
                  activeCategory === 'axios'
                    ? 'Search by wing or subject…'
                    : 'Search by subject or faculty…'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters((p) => !p)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm transition-colors duration-150
                ${showFilters ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 p-3 rounded-md border border-border bg-muted/40">
              <FilterDropdown
                label="Subject"
                value={selectedSubject}
                options={subjects}
                onChange={setSelectedSubject}
              />
              {activeCategory === 'academic' ? (
                <>
                  <FilterDropdown
                    label="Batch"
                    value={selectedBatch}
                    options={batches}
                    onChange={setSelectedBatch}
                  />
                  <FilterDropdown
                    label="Semester"
                    value={selectedSemester}
                    options={semesters}
                    onChange={setSelectedSemester}
                  />
                  <FilterDropdown
                    label="Exam Type"
                    value={selectedExam}
                    options={exams}
                    onChange={setSelectedExam}
                  />
                </>
              ) : (
                <>
                  <FilterDropdown
                    label="Wing"
                    value={selectedWing}
                    options={wings}
                    onChange={setSelectedWing}
                  />
                  <FilterDropdown
                    label="Beneficial for"
                    value={selectedAudience}
                    options={audiences}
                    onChange={setSelectedAudience}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Result count */}
        {!isLoading && !error && (
          <p className="text-sm text-muted-foreground">
            {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}{' '}
            in{' '}
            <span className="text-foreground font-medium">
              {CATEGORIES.find((c) => c.id === activeCategory)?.label}
            </span>
          </p>
        )}

        {/* Notes list */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Loading notes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={fetchNotes}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Retry
            </button>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No notes found matching your filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredNotes.map((note, index) => (
              <NoteCard
                key={note.id ?? index}
                note={note}
                onDelete={fetchNotes}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notes
