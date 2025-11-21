'use client'

import React, { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, FileText, Calendar, BookOpen, GraduationCap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const EditPaperPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const unwrappedParams = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject: '',
    year: '',
    semester: '',
    term: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)

  // Fetch paper details on mount
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/papers')
      return
    }

    if (status === 'authenticated') {
      fetchPaperDetails()
    }
  }, [status, unwrappedParams.id, router])

  const fetchPaperDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch the specific paper
      const response = await fetch(`/api/papers?limit=1000`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch paper details')
      }

      // Find the specific paper
      const paper = data.papers.papers.find((p: { _id: string }) => p._id === unwrappedParams.id)

      if (!paper) {
        throw new Error('Paper not found')
      }

      // Check if user can edit
      const userId = session?.user?.id
      const userEmail = session?.user?.email
      const isUploader = paper.uploaded_by === userId
      const isTechnicalClub = userEmail === 'technicalclub@iiitl.ac.in'

      if (!isUploader && !isTechnicalClub) {
        setError('You are not authorized to edit this paper')
        setCanEdit(false)
        setIsLoading(false)
        return
      }

      setCanEdit(true)

      // Populate form with existing data
      setFormData({
        title: paper.title || '',
        content: paper.content || '',
        subject: paper.subject || '',
        year: paper.year?.toString() || '',
        semester: paper.semester?.toString() || '',
        term: paper.term || ''
      })

    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load paper details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate form data
      if (!formData.title || !formData.content || !formData.subject || !formData.year || !formData.semester || !formData.term) {
        setError('Please fill in all required fields')
        setIsSaving(false)
        return
      }

      // Make API call
      const response = await fetch(`/api/papers?id=${unwrappedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update paper')
      }

      // Success
      setSuccess('Paper updated successfully! Redirecting...')

      // Redirect to papers page after 2 seconds
      setTimeout(() => {
        router.push('/papers')
      }, 2000)

    } catch (err) {
      console.error('Update error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update paper. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Show loading state while checking authentication or fetching data
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the form if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null
  }

  // Don't render the form if user can't edit
  if (!canEdit) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">{error || 'You are not authorized to edit this paper'}</p>
              <Button onClick={() => router.push('/papers')}>
                Go Back to Papers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Question Paper</h1>
          <p className="text-muted-foreground">Update the question paper details</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="pt-6">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive">Error</h4>
                  <p className="text-sm text-destructive/90">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-500">Success</h4>
                  <p className="text-sm text-green-500/90">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Field */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Paper Title *
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter the paper title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              {/* Content/Description Field */}
              <div className="space-y-2">
                <Label htmlFor="content" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Description *
                </Label>
                <Textarea
                  id="content"
                  placeholder="Describe the paper content or any additional notes..."
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  className="w-full min-h-[100px] resize-y"
                  required
                />
              </div>

              {/* Subject Field */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Subject *
                </Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="Enter the subject name"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              {/* Year and Semester Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Year Field */}
                <div className="space-y-2">
                  <Label htmlFor="year" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Year *
                  </Label>
                  <Select 
                    value={formData.year} 
                    onValueChange={(value: string) => handleSelectChange('year', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                      <SelectItem value="2021">2021</SelectItem>
                      <SelectItem value="2020">2020</SelectItem>
                      <SelectItem value="2019">2019</SelectItem>
                      <SelectItem value="2018">2018</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Semester Field */}
                <div className="space-y-2">
                  <Label htmlFor="semester" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Semester *
                  </Label>
                  <Select 
                    value={formData.semester} 
                    onValueChange={(value: string) => handleSelectChange('semester', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                      <SelectItem value="3">Semester 3</SelectItem>
                      <SelectItem value="4">Semester 4</SelectItem>
                      <SelectItem value="5">Semester 5</SelectItem>
                      <SelectItem value="6">Semester 6</SelectItem>
                      <SelectItem value="7">Semester 7</SelectItem>
                      <SelectItem value="8">Semester 8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Exam Type Field */}
              <div className="space-y-2">
                <Label htmlFor="term" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Exam Type *
                </Label>
                <Select 
                  value={formData.term} 
                  onValueChange={(value: string) => handleSelectChange('term', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mid">Mid Semester</SelectItem>
                    <SelectItem value="End">End Semester</SelectItem>
                    <SelectItem value="Class_test_1">Class Test 1</SelectItem>
                    <SelectItem value="Class_test_2">Class Test 2</SelectItem>
                    <SelectItem value="Class_test_3">Class Test 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/papers')}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <h4 className="font-medium text-foreground">Note:</h4>
              <ul className="space-y-1 ml-4">
                <li>• All fields marked with * are required</li>
                <li>• You can only edit the metadata, not the uploaded file</li>
                <li>• Changes will be reflected immediately after saving</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default EditPaperPage
