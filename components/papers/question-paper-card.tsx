'use client'
import React from 'react'
import { Card } from '../ui/card'
import { TypeQuestionPaper } from '@/types/question-paper'
import { FaEye, FaDownload } from 'react-icons/fa'

type QuestionPaperCardProps = {
  questionPaper: TypeQuestionPaper
  setSelectedPdfUrl: (url: string | null) => void
}

const QuestionPaperCard: React.FC<QuestionPaperCardProps> = ({
  questionPaper,
  setSelectedPdfUrl,
}) => {
  return (
    <Card className="w-full flex flex-col md:flex-row p-4 justify-between items-start md:items-center bg-border/20 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
      <h2 className="text-xl truncate w-full" title={questionPaper.subject}>
        {questionPaper.subject}
      </h2>
      <div className="flex flex-row-reverse shrink-0 md:flex-row justify-center items-center gap-4">
        <p className="text-foreground">
          {questionPaper.batch} - {questionPaper.exam} Semester{' '}
          {questionPaper.semester}
        </p>
        <a
          className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
          href={`${questionPaper.url}`}
          aria-label={`Download ${questionPaper.subject} question paper`}
          rel="noopener noreferrer"
          target="_blank"
          download
        >
          <FaDownload />
        </a>
        <button
        type='button'
          className="cursor-pointer bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200"
          onClick={() =>
            setSelectedPdfUrl(questionPaper.viewUrl)
          }
          aria-label={`View ${questionPaper.subject} question paper`}
        >
          <FaEye />
        </button>
      </div>
    </Card>
  )
}

export default QuestionPaperCard
