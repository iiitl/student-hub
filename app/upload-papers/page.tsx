'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Upload,
  FileText,
  Calendar,
  BookOpen,
  GraduationCap,
  FileUp,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const UploadPaperPage = () => {
  const router = useRouter()
  const { data: session, status } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    facultyName: '',
    content: '',
    subject: '',
    year: '',
    semester: '',
    term: '',
    uploaded_file: null as File | null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Subject related state
  const [subjects, setSubjects] = useState<string[]>([])
  const [isNewSubject, setIsNewSubject] = useState(false)
  const [customSubject, setCustomSubject] = useState('')
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/upload-papers')
    }
  }, [status, router])

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setIsLoadingSubjects(true)
        const response = await fetch('/api/papers/subjects')
        const data = await response.json()
        if (data.success) {
          setSubjects(data.subjects)
        }
      } catch (error) {
        console.error('Failed to fetch subjects:', error)
      } finally {
        setIsLoadingSubjects(false)
      }
    }

    fetchSubjects()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSelectChange = (field: string, value: string) => {
    if (field === 'subject') {
      if (value === 'new_subject') {
        setIsNewSubject(true)
        setFormData((prev) => ({ ...prev, subject: '' }))
      } else {
        setIsNewSubject(false)
        setFormData((prev) => ({ ...prev, subject: value }))
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({
      ...prev,
      uploaded_file: file,
    }))
    // Clear error when user selects a new file
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate form data
      const finalSubject = isNewSubject ? customSubject : formData.subject

      if (
        !formData.content ||
        !finalSubject ||
        !formData.year ||
        !formData.semester ||
        !formData.term ||
        !formData.uploaded_file
      ) {
        setError('Please fill in all required fields')
        setIsLoading(false)
        return
      }

      // Validate file size (25MB max)
      const maxSize = 25 * 1024 * 1024 // 25MB in bytes
      if (formData.uploaded_file.size > maxSize) {
        setError('File size must be less than 25MB')
        setIsLoading(false)
        return
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp',
      ]
      if (!allowedTypes.includes(formData.uploaded_file.type)) {
        setError('Only PDF, PNG, JPG, JPEG, and WEBP files are allowed')
        setIsLoading(false)
        return
      }

      // Create FormData object
      const submitFormData = new FormData()
      submitFormData.append('facultyName', formData.facultyName)
      submitFormData.append('content', formData.content)
      submitFormData.append('subject', finalSubject)
      submitFormData.append('year', formData.year)
      submitFormData.append('semester', formData.semester)
      submitFormData.append('term', formData.term)
      submitFormData.append('uploaded_file', formData.uploaded_file)


	if (session?.user?.email) {
  submitFormData.append('user_email', session.user.email)
}


      // Make API call
      const response = await fetch('/api/papers', {
        method: 'POST',
        body: submitFormData,
      })

      // Try to parse JSON response
      let data
      try {
        data = await response.json()
      } catch {
        // If response is not JSON, throw a generic error
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`
        )
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload paper')
      }

      // Success
      setSuccess('Paper uploaded successfully!')
      
      // Reset form
      setFormData({
        facultyName: '',
        content: '',
        subject: '',
        year: '',
        semester: '',
        term: '',
        uploaded_file: null,
      })
      setCustomSubject('')
      setIsNewSubject(false)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (err) {
      console.error('Upload error:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to upload paper. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the form if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Upload Question Paper
          </h1>
          <p className="text-muted-foreground">
            Share your question papers with the student community
          </p>
        </div>

        <Card className="shadow-lg">
          <CardContent>
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
              {/* Subject Field */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Subject *
                </Label>
                {!isNewSubject ? (
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange('subject', value)
                    }
                    value={
                      formData.subject && !isNewSubject
                        ? formData.subject
                        : undefined
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="new_subject"
                        className="text-primary font-medium"
                      >
                        + Add New Subject
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      id="subject"
                      type="text"
                      placeholder="Enter new subject name"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsNewSubject(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Title Field */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Paper Title *
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter the paper title (e.g.,Data Structure Final Exam 2024)"
                  value={formData.facultyName}
                  onChange={(e) =>
                    handleInputChange('facultyName', e.target.value)
                  }
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

              {/* Year and Semester Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Year Field */}
                <div className="space-y-2">
                  <Label htmlFor="year" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Year *
                  </Label>
                  <Select
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
                  <Label htmlFor="semester" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Semester *
                  </Label>
                  <Select
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
                    <SelectItem value="Class_test_1">Class Test 1</SelectItem>
                    <SelectItem value="Class_test_2">Class Test 2</SelectItem>
                    <SelectItem value="Class_test_3">Class Test 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload Field */}
              <div className="space-y-2">
                <Label htmlFor="file" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File *
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {formData.uploaded_file
                            ? formData.uploaded_file.name
                            : 'Click to upload file'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, PNG, JPG, JPEG, WEBP (Max 25MB)
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
                {formData.uploaded_file && (
                  <p className="text-xs text-green-600">
                    ✓ File selected: {formData.uploaded_file.name} (
                    {(formData.uploaded_file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Question Paper
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
              <h4 className="font-medium text-foreground">
                Upload Guidelines:
              </h4>
              <ul className="space-y-1 ml-4">
                <li>• Ensure the paper is clear and readable</li>
                <li>• Maximum file size: 25MB</li>
                <li>• Supported formats: PDF, PNG, JPG, JPEG, WEBP</li>
                <li>• All fields marked with * are required</li>
                <li>
                  • Your uploaded paper will be reviewed before publication
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default UploadPaperPage
