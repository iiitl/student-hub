'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Download,
  Eye,
  FileText,
  Calendar,
  GraduationCap,
  Trash2,
  Edit,
  Info,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TypeQuestionPaper } from '@/types/question-paper'

type QuestionPaperCardProps = {
  questionPaper: TypeQuestionPaper
  onDelete?: () => void
}

const QuestionPaperCard = ({
  questionPaper,
  onDelete,
}: QuestionPaperCardProps) => {
  const { data: session } = useSession()
  const router = useRouter()
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    if (session?.user) {
      const userId = session.user.id
      const userEmail = session.user.email
      const isUploader = questionPaper.uploadedBy === userId
      const isTechnicalClub = userEmail === 'technicalclub@iiitl.ac.in'
      setCanEdit(isUploader || isTechnicalClub)
    }
  }, [session, questionPaper.uploadedBy])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = questionPaper.url
    link.download =
      questionPaper.fileName ||
      `${questionPaper.subject}_${questionPaper.exam}_${questionPaper.batch}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleView = () => {
    if (questionPaper.viewUrl) {
      window.open(questionPaper.viewUrl, '_blank')
    } else {
      window.open(questionPaper.url, '_blank')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this paper?')) return

    try {
      const response = await fetch(`/api/papers?id=${questionPaper.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (onDelete) onDelete()
      } else {
        const data = await response.json()
        alert(data.message || 'Failed to delete paper')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete paper')
    }
  }

  const handleEdit = () => {
    router.push(`/papers/edit/${questionPaper.id}`)
  }

  const getBadgeClasses = (examType: string) => {
    const baseClasses =
      'uppercase text-xs font-bold px-2 py-0.5 rounded-full border'
    switch (examType.toLowerCase()) {
      case 'midsem':
        return `${baseClasses} bg-primary/10 text-primary border-primary/20`
      case 'endsem':
        return `${baseClasses} bg-secondary text-secondary-foreground border-secondary`
      case 'quiz':
        return `${baseClasses} bg-muted text-muted-foreground border-border`
      default:
        return `${baseClasses} bg-primary/10 text-primary border-primary/20`
    }
  }

  return (
    <Card className="w-full flex flex-col bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={getBadgeClasses(questionPaper.exam)}>
                {questionPaper.exam.replace(/_/g, ' ')}
              </span>

              {/* Custom Tooltip Implementation */}
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-muted p-0"
                >
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
                <div className="absolute left-full top-0 ml-2 w-64 p-3 bg-popover text-popover-foreground text-sm rounded-md shadow-md border z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                  <div className="font-semibold mb-1">
                    Faculty: {questionPaper.facultyName || 'N/A'}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {questionPaper.description || 'No description available'}
                  </div>
                </div>
              </div>
            </div>
            <h3
              className="font-bold text-lg line-clamp-2 leading-tight"
              title={questionPaper.subject}
            >
              {questionPaper.subject}
            </h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          <span>{questionPaper.batch} Batch</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Semester {questionPaper.semester}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleDownload}
          className="cursor-pointer hover:bg-muted transition-colors duration-200"
          aria-label={`Download ${questionPaper.subject} question paper`}
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleView}
          className="cursor-pointer hover:bg-muted transition-colors duration-200"
          aria-label={`View ${questionPaper.subject} question paper`}
        >
          <Eye className="h-4 w-4" />
        </Button>
        {canEdit && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={handleEdit}
              className="cursor-pointer hover:bg-muted transition-colors duration-200"
              aria-label={`Edit ${questionPaper.subject} question paper`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              className="cursor-pointer hover:bg-destructive/90 transition-colors duration-200"
              aria-label={`Delete ${questionPaper.subject} question paper`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

export default QuestionPaperCard
