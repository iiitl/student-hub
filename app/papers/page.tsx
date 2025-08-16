'use client'
import React, { useState, useEffect } from 'react'
import QuestionPaperCard from '@/components/papers/question-paper-card'
import { TypeQuestionPaper } from '@/types/question-paper'
import questionPapers from '@/data/question-papers'
import PaperFilterDropdown from '@/components/papers/paper-filter-dropdown'
import { PdfModal } from '@/components/papers/pdf-modal'

// Use Set for automatic deduplication
const batches = [
  ...new Set(questionPapers.map((paper) => paper.batch.toString())),
]
  .sort((a, b) => {
    return Number(a) - Number(b)
  })
  .concat('All')
const semesters = [...Array(8).keys()]
  .map((sem) => (sem + 1).toString())
  .concat('All')
const subjects = [
  ...new Set(questionPapers.map((paper) => paper.subjectCode)),
].concat('All')
const exams = ['All', 'Mid', 'End', 'CT']

const QuestionPapers = () => {
  const [selectedBatch, setSelectedBatch] = useState<string>('All')
  const [selectedSemester, setSelectedSemester] = useState<string>('All')
  const [selectedExam, setSelectedExam] = useState<string>('All')
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null)

  const [userQuestionPapers, setUserQuestionPapers] =
    useState<TypeQuestionPaper[]>(questionPapers)

  useEffect(() => {
    const filteredQuestionPapers = questionPapers.filter(
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
          questionPaper.subjectCode !== selectedSubject
        )
          return false
        if (selectedExam !== 'All' && questionPaper.exam !== selectedExam)
          return false
        return true
      }
    )
    setUserQuestionPapers(filteredQuestionPapers)
  }, [selectedBatch, selectedSemester, selectedSubject, selectedExam])

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <h1 className="text-3xl font-semibold mt-6 mb-2">Question Papers</h1>
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
        {userQuestionPapers.length === 0 ? (
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
          userQuestionPapers.map((questionPaper: TypeQuestionPaper) => (
            <div
              key={`${questionPaper.subject}-${questionPaper.subjectCode}-${questionPaper.batch}-${questionPaper.exam}-${questionPaper.semester}`}
              className="w-full"
            >
              <QuestionPaperCard
                questionPaper={questionPaper}
                setSelectedPdfUrl={setSelectedPdfUrl}
              />
            </div>
          ))
        )}
      </div>
      <PdfModal url={selectedPdfUrl} setUrl={setSelectedPdfUrl} />
    </div>
  )
}

export default QuestionPapers
