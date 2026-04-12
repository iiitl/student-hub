'use client'

import React, { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Save,
  FileText,
  Calendar,
  BookOpen,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const EditNotePage = ({ params }: { params: Promise<{ id: string }> }) => {
  const unwrappedParams = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [formData, setFormData] = useState({
    facultyName: '',
    content: '',
    subject: '',
    year: '',
    semester: '',
    term: '',
    category: 'academic',
    wing: '',
    targetAudience: '',
    presenterName: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)

  // Fetch note details on mount
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/notes')
      return
    }

    if (status === 'authenticated') {
      fetchNoteDetails()
    }
  }, [status, unwrappedParams.id, router])

  const fetchNoteDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch the specific note
      const response = await fetch(`/api/notes?limit=1000`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch note details')
      }

      // Find the specific note
      const note = data.notes.notes.find(
        (n: { _id: string }) => n._id === unwrappedParams.id
      )

      if (!note) {
        throw new Error('Note not found')
      }

      // Check if user can edit
      const userId = session?.user?.id
      const userEmail = session?.user?.email
      const isUploader = note.uploaded_by === userId
      const isTechnicalClub = userEmail === 'technicalclub@iiitl.ac.in'

      if (!isUploader && !isTechnicalClub) {
        setError('You are not authorized to edit this note')
        setCanEdit(false)
        setIsLoading(false)
        return
      }

      setCanEdit(true)

      // Populate form with existing data
      setFormData({
        facultyName: note.facultyName || '',
        content: note.content || '',
        subject: note.subject || '',
        year: note.year?.toString() || '',
        semester: note.semester?.toString() || '',
        term: note.term || '',
        category: note.category || 'academic',
        wing: note.wing || '',
        targetAudience: note.targetAudience || '',
        presenterName: note.presenterName || '',
      })
    } catch (err) {
      console.error('Fetch error:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to load note details'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate form data
      const isAcademic = formData.category === 'academic'

      if (
        !formData.subject ||
        (isAcademic &&
          (!formData.year || !formData.semester || !formData.term)) ||
        (!isAcademic && !formData.wing)
      ) {
        setError('Please fill in all required fields')
        setIsSaving(false)
        return
      }

      const updatePayload: Record<string, string> = {
        subject: formData.subject,
        content: formData.content,
        // we can include all for simplicy or just filter
        category: formData.category,
      }

      if (isAcademic) {
        updatePayload.facultyName = formData.facultyName
        updatePayload.year = formData.year
        updatePayload.semester = formData.semester
        updatePayload.term = formData.term
      } else {
        updatePayload.wing = formData.wing
        if (formData.targetAudience)
          updatePayload.targetAudience = formData.targetAudience
        if (formData.presenterName)
          updatePayload.presenterName = formData.presenterName
      }

      // Make API call
      const response = await fetch(`/api/notes?id=${unwrappedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update note')
      }

      // Success
      setSuccess('Note updated successfully! Redirecting...')

      // Redirect to notes page after 2 seconds
      setTimeout(() => {
        router.push('/notes')
      }, 2000)
    } catch (err) {
      console.error('Update error:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update note. Please try again.'
      )
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
              <p className="text-muted-foreground mb-4">
                {error || 'You are not authorized to edit this note'}
              </p>
              <Button onClick={() => router.push('/notes')}>
                Go Back to Notes
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Note</h1>
          <p className="text-muted-foreground">Update the note details</p>
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
              {formData.category === 'academic' ? (
                <>
                  {/* Faculty Name Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="facultyName"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Teaching Faculty Name (Optional)
                    </Label>
                    <Input
                      id="facultyName"
                      type="text"
                      placeholder="Enter the teaching faculty name"
                      value={formData.facultyName}
                      onChange={(e) =>
                        handleInputChange('facultyName', e.target.value)
                      }
                      className="w-full"
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
                        onValueChange={(value: string) =>
                          handleSelectChange('year', value)
                        }
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
                      <Label
                        htmlFor="semester"
                        className="flex items-center gap-2"
                      >
                        <GraduationCap className="h-4 w-4" />
                        Semester *
                      </Label>
                      <Select
                        value={formData.semester}
                        onValueChange={(value: string) =>
                          handleSelectChange('semester', value)
                        }
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
                      onValueChange={(value: string) =>
                        handleSelectChange('term', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select exam type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mid">Mid Semester</SelectItem>
                        <SelectItem value="End">End Semester</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  {/* Wing Field */}
                  <div className="space-y-2">
                    <Label htmlFor="wing" className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Wing *
                    </Label>
                    <Select
                      value={formData.wing}
                      onValueChange={(value: string) =>
                        handleSelectChange('wing', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select wing" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'ML',
                          'Web3',
                          'Web',
                          'FOSS',
                          'InfoSec',
                          'Design',
                          'App',
                          'CP',
                        ].map((w) => (
                          <SelectItem key={w} value={w}>
                            {w}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Presenter Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="presenterName"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Presenter (Optional)
                    </Label>
                    <Input
                      id="presenterName"
                      type="text"
                      placeholder="e.g. John Doe"
                      value={formData.presenterName}
                      onChange={(e) =>
                        handleInputChange('presenterName', e.target.value)
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Target Audience */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="targetAudience"
                      className="flex items-center gap-2"
                    >
                      <GraduationCap className="h-4 w-4" />
                      Beneficial for (Optional)
                    </Label>
                    <Select
                      value={formData.targetAudience}
                      onValueChange={(value: string) =>
                        handleSelectChange('targetAudience', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Year">1st Year</SelectItem>
                        <SelectItem value="2nd Year">2nd Year</SelectItem>
                        <SelectItem value="3rd Year">3rd Year</SelectItem>
                        <SelectItem value="4th Year">4th Year</SelectItem>
                        <SelectItem value="All">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/notes')}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
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

export default EditNotePage
