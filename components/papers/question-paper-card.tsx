'use client'
import React, { useState, useEffect } from 'react'
import { Card } from '../ui/card'
import { TypeQuestionPaper } from '@/types/question-paper'
it import { FaEye, FaDownload, FaTrash, FaEdit } from 'react-icons/fa'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type QuestionPaperCardProps = {
  questionPaper: TypeQuestionPaper
  onDelete?: () => void
}

// Path to question paper files, configurable via environment variable
const FILE_PATH = process.env.NEXT_PUBLIC_FILES_PATH || '/'

const QuestionPaperCard: React.FC<QuestionPaperCardProps> = ({
  questionPaper,
  onDelete,
}) => {
  const { data: session } = useSession()
  const router = useRouter()
  const [canModify, setCanModify] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  useEffect(() => {
    // Check if user can modify (edit/delete) this paper
    if (session?.user) {
      const userId = session.user.id
      const userEmail = session.user.email
      
      const isUploader = questionPaper.uploadedBy === userId
      const isTechnicalClub = userEmail === 'technicalclub@iiitl.ac.in'
      
      setCanModify(isUploader || isTechnicalClub)
    }
  }, [session, questionPaper.uploadedBy])
  
  const handleDownload = async () => {
    try {
      const response = await fetch(questionPaper.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Use the original filename if available, otherwise generate one
      const filename = questionPaper.fileName || `${questionPaper.subject}_${questionPaper.batch}_Sem${questionPaper.semester}_${questionPaper.exam}.pdf`
      link.download = filename
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to direct download
      window.open(questionPaper.url, '_blank')
    }
  }

  const handleEdit = () => {
    if (!questionPaper.id) {
      alert('Paper ID not found')
      return
    }
    router.push(`/papers/edit/${questionPaper.id}`)
  }

  const handleDelete = async () => {
    if (!questionPaper.id) {
      alert('Paper ID not found')
      return
    }
    
    if (!confirm(`Are you sure you want to delete "${questionPaper.subject}"?`)) {
      return
    }
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/papers?id=${questionPaper.id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete paper')
      }
      
      alert('Paper deleted successfully')
      
      // Call the onDelete callback to refresh the list
      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete paper')
    } finally {
      setIsDeleting(false)
    }
  }

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
        <button
          onClick={handleDownload}
          className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
          aria-label={`Download ${questionPaper.subject} question paper`}
        >
          <FaDownload />
        </button>
        <a
          className="cursor-pointer bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200"
          href={`${questionPaper.viewUrl || questionPaper.url}`}
          rel="noopener noreferrer"
          target="_blank"
          aria-label={`View ${questionPaper.subject} question paper`}
        >
          <FaEye />
        </a>
        {canModify && (
          <>
            <button
              onClick={handleEdit}
              className="cursor-pointer bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors duration-200"
              aria-label={`Edit ${questionPaper.subject} question paper`}
            >
              <FaEdit />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="cursor-pointer bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Delete ${questionPaper.subject} question paper`}
            >
              {isDeleting ? '...' : <FaTrash />}
            </button>
          </>
        )}
      </div>
    </Card>
  )
}

export default QuestionPaperCard
