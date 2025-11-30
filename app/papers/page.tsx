'use client'
import React, { useEffect, useState } from 'react'
import QuestionPaperCard from '@/components/papers/question-paper-card'
import { TypeQuestionPaper } from '@/types/question-paper'
import PaperFilterDropdown from '@/components/papers/paper-filter-dropdown'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

const QuestionPapers = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedBatch, setSelectedBatch] = useState<string>('All')
  const [selectedSemester, setSelectedSemester] = useState<string>('All')
  const [selectedExam, setSelectedExam] = useState<string>('All')
  const [selectedSubject, setSelectedSubject] = useState<string>('All')

  const [allPapers, setAllPapers] = useState<TypeQuestionPaper[]>([])
  const [userQuestionPapers, setUserQuestionPapers] = useState<TypeQuestionPaper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dynamic filter options
  const [batches, setBatches] = useState<string[]>(['All'])
  const [semesters, setSemesters] = useState<string[]>(['All'])
  const [subjects, setSubjects] = useState<string[]>(['All'])
  const [exams, setExams] = useState<string[]>(['Mid', 'End', 'All', 'Class_test_1', 'Class_test_2', 'Class_test_3'])

  // Fetch papers from backend
  useEffect(() => {
    fetchPapers()
  }, [])

  const fetchPapers = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/papers?limit=1000') // Fetch all papers
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch papers')
        }

        // Transform backend data to match TypeQuestionPaper interface
        const transformedPapers: TypeQuestionPaper[] = data.papers.papers.map((paper: {
          subject?: string
          title?: string
          year: string
          semester?: string
          term: string
          document_url: string
          file_name: string
          file_type: string
          _id: string
          uploaded_by: string
        }) => ({
          subject: paper.subject || paper.title,
          subjectCode: paper.subject || paper.title,
          batch: paper.year,
          semester: paper.semester || extractSemesterNumber(paper.term),
          exam: normalizeExamType(paper.term),
          url: paper.document_url,
          viewUrl: paper.document_url,
          fileName: paper.file_name,
          fileType: paper.file_type,
          id: paper._id,
          uploadedBy: paper.uploaded_by,
        }))

        setAllPapers(transformedPapers)
        setUserQuestionPapers(transformedPapers)

        // Generate filter options from fetched data
        const uniqueBatches = [...new Set(transformedPapers.map((paper) => paper.batch.toString()))]
          .sort((a, b) => Number(b) - Number(a))
        setBatches([...uniqueBatches, 'All'])

        const uniqueSubjects = [...new Set(transformedPapers.map((paper) => paper.subject))]
          .sort()
        setSubjects([...uniqueSubjects, 'All'])

        const uniqueSemesters = [...new Set(transformedPapers.map((paper) => paper.semester.toString()))]
          .sort((a, b) => Number(a) - Number(b))
        setSemesters([...uniqueSemesters, 'All'])

      } catch (err) {
        console.error('Error fetching papers:', err)
        setError(err instanceof Error ? err.message : 'Failed to load papers')
      } finally {
        setIsLoading(false)
      }
    }

  // Helper function to extract semester number from term
  const extractSemesterNumber = (term: string): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 => {
    // If term contains "semester-X", extract X
    const match = term.match(/semester[- ]?(\d)/i)
    if (match) {
      const num = parseInt(match[1])
      if (num >= 1 && num <= 8) return num as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    }
    return 1 // Default fallback
  }

  // Helper function to normalize exam type
  const normalizeExamType = (term: string): 'Mid' | 'End' | 'Both' | 'Class_test_1' | 'Class_test_2' | 'Class_test_3' => {
    const lowerTerm = term.toLowerCase()
    if (lowerTerm.includes('mid')) return 'Mid'
    if (lowerTerm.includes('end')) return 'End'
    if (lowerTerm.includes('class_test_1') || lowerTerm.includes('ct1')) return 'Class_test_1'
    if (lowerTerm.includes('class_test_2') || lowerTerm.includes('ct2')) return 'Class_test_2'
    if (lowerTerm.includes('class_test_3') || lowerTerm.includes('ct3')) return 'Class_test_3'
    return 'Mid' // Default fallback
  }

  // Filter papers based on selected filters
  useEffect(() => {
    const filteredQuestionPapers = allPapers.filter(
      (questionPaper: TypeQuestionPaper) => {
        if (
          selectedBatch !== 'All' &&
          questionPaper.batch.toString() !== selectedBatch
        )
          return false
        if (
          selectedSemester !== 'All' &&
          questionPaper.semester.toString() !== selectedSemester
        )
          return false
        if (
          selectedSubject !== 'All' &&
          questionPaper.subject !== selectedSubject
        )
          return false
        if (selectedExam !== 'All' && questionPaper.exam !== selectedExam)
          return false
        return true
      }
    )
    setUserQuestionPapers(filteredQuestionPapers)
  }, [selectedBatch, selectedSemester, selectedSubject, selectedExam, allPapers])

  // Callback to refresh papers after deletion
  const handlePaperDeleted = () => {
    fetchPapers()
  }

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="flex flex-col sm:flex-row sm:relative sm:justify-center items-center w-full max-w-7xl px-5 mt-6 mb-2 gap-3 sm:gap-0">
        <h1 className="text-3xl font-semibold text-center">Question Papers</h1>
        <Button
          onClick={() => router.push('/upload-papers')}
          className="sm:absolute sm:right-5 flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Paper
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
          <h3 className="text-lg">Exam</h3>
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
            <p className="text-lg">Loading question papers...</p>
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
        ) : userQuestionPapers.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg">
              No question papers found matching your filters.
            </p>
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
          userQuestionPapers.map((questionPaper: TypeQuestionPaper, index) => (
            <div
              key={`${questionPaper.subject}-${questionPaper.batch}-${questionPaper.exam}-${questionPaper.semester}-${index}`}
              className="w-full"
            >
              <QuestionPaperCard questionPaper={questionPaper} onDelete={handlePaperDeleted} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default QuestionPapers
