'use client'

import { useToast } from '@/context/toast-provider'
import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  GraduationCap,
  CheckCircle,
  BookOpen,
  Tag,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { NoteCategory } from '@/types/note'

const UploadNotePage = () => {
  const router = useRouter()
  const { status } = useSession()
  const { addToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    facultyName: '',
    content: '',
    subject: '',
    year: '',
    semester: '',
    term: '',
    category: 'academic' as NoteCategory,
    uploaded_file: null as File | null,
  })
  const [isLoading, setIsLoading] = useState(false)

  const [subjects, setSubjects] = useState<string[]>([])
  const [isNewSubject, setIsNewSubject] = useState(false)
  const [customSubject, setCustomSubject] = useState('')
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/upload-notes')
    }
  }, [status, router])

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setIsLoadingSubjects(true)
        const response = await fetch('/api/notes/subjects')
        const data = await response.json()
        if (data.success) setSubjects(data.subjects)
      } catch (error) {
        console.error('Failed to fetch subjects:', error)
      } finally {
        setIsLoadingSubjects(false)
      }
    }
    fetchSubjects()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleFileChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, uploaded_file: file }))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0] || null
    handleFileChange(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const finalSubject = isNewSubject ? customSubject : formData.subject

      if (
        !finalSubject ||
        !formData.facultyName ||
        !formData.year ||
        !formData.semester ||
        !formData.term ||
        !formData.uploaded_file
      ) {
        const msg = 'Please fill in all required fields'
        addToast(msg)
        addToast('Validation Error', msg, 'error')
        setIsLoading(false)
        return
      }

      const maxSize = 25 * 1024 * 1024
      if (formData.uploaded_file.size > maxSize) {
        const msg = 'File size must be less than 25MB'
        addToast(msg)
        addToast('File Too Large', msg, 'error')
        setIsLoading(false)
        return
      }

      const allowedTypes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp',
      ]
      if (!allowedTypes.includes(formData.uploaded_file.type)) {
        const msg = 'Only PDF, PNG, JPG, JPEG, and WEBP files are allowed'
        addToast(msg)
        addToast('Invalid File Type', msg, 'error')
        setIsLoading(false)
        return
      }

      const submitFormData = new FormData()
      submitFormData.append('facultyName', formData.facultyName)
      submitFormData.append('content', formData.content)
      submitFormData.append('subject', finalSubject)
      submitFormData.append('year', formData.year)
      submitFormData.append('semester', formData.semester)
      submitFormData.append('term', formData.term)
      submitFormData.append('category', formData.category)
      submitFormData.append('uploaded_file', formData.uploaded_file)

      const response = await fetch('/api/notes', {
        method: 'POST',
        body: submitFormData,
      })

      let data
      try {
        data = await response.json()
      } catch {
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`
        )
      }

      if (!response.ok) throw new Error(data.message || 'Failed to upload note')

      const successMsg = 'Note uploaded successfully!'
      addToast(successMsg)
      addToast('Upload Successful', successMsg, 'success')
      setFormData({
        facultyName: '',
        content: '',
        subject: '',
        year: '',
        semester: '',
        term: '',
        category: 'academic',
        uploaded_file: null,
      })
      setCustomSubject('')
      setIsNewSubject(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error('Upload error:', err)
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to upload note. Please try again.'
      addToast(errorMsg)
      addToast('Upload Failed', errorMsg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="inline-block h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl px-5 mt-6 mb-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:relative sm:justify-center items-center gap-3">
          <h1 className="text-3xl font-semibold text-center">Upload a Note</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Tag className="w-4 h-4" />
              Category *
            </label>
            <Select
              value={formData.category}
              onValueChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  category: v as NoteCategory,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic">Academic Notes</SelectItem>
                <SelectItem value="axios">Axios — Technical Club</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label
              htmlFor="subject"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <GraduationCap className="w-4 h-4" />
              Subject *
            </label>
            {!isNewSubject ? (
              <Select
                onValueChange={(value) => handleSelectChange('subject', value)}
                value={
                  formData.subject && !isNewSubject
                    ? formData.subject
                    : undefined
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingSubjects ? 'Loading subjects…' : 'Select subject'
                    }
                  />
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
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewSubject(false)}
                  className="flex-shrink-0"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Faculty Name */}
          <div className="space-y-2">
            <label
              htmlFor="facultyName"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              Teaching Faculty Name *
            </label>
            <Input
              id="facultyName"
              type="text"
              placeholder="e.g. Dr. Rajan Kumar"
              value={formData.facultyName}
              onChange={(e) => handleInputChange('facultyName', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="content"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <BookOpen className="w-4 h-4" />
              Description
              <span className="text-muted-foreground text-xs font-normal">
                (optional)
              </span>
            </label>
            <Textarea
              id="content"
              placeholder="Brief description of the note content…"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className="min-h-[80px] resize-y"
            />
          </div>

          {/* Batch + Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                Batch (Joining Year) *
              </label>
              <Select
                value={formData.year || ''}
                onValueChange={(v) => handleSelectChange('year', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {[2026, 2025, 2024, 2023, 2022, 2021].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <GraduationCap className="w-4 h-4" />
                Semester *
              </label>
              <Select
                value={formData.semester || ''}
                onValueChange={(v) => handleSelectChange('semester', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      Semester {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exam Type */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <GraduationCap className="w-4 h-4" />
              Exam Type *
            </label>
            <Select
              value={formData.term || ''}
              onValueChange={(v) => handleSelectChange('term', v)}
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

          {/* File Upload */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Upload className="w-4 h-4" />
              Upload File *
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 cursor-pointer
                ${
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : formData.uploaded_file
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/40'
                }`}
            >
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="file"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {formData.uploaded_file ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {formData.uploaded_file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(formData.uploaded_file.size / 1024 / 1024).toFixed(2)}{' '}
                      MB &nbsp;·&nbsp;
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          handleFileChange(null)
                          if (fileInputRef.current)
                            fileInputRef.current.value = ''
                        }}
                        className="text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Click to upload or drag & drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, PNG, JPG, JPEG, WEBP · Max 25 MB
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Note
              </>
            )}
          </Button>
        </form>

        {/* Guidelines */}
        <div className="rounded-lg border border-border bg-muted/30 px-5 py-4">
          <h4 className="text-sm font-semibold mb-2">Upload Guidelines</h4>
          <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
            <li>
              Select the correct category — Academic for university notes, Axios
              for Technical Club resources
            </li>
            <li>
              Maximum file size: <span className="text-foreground">25 MB</span>
            </li>
            <li>
              Supported formats:{' '}
              <span className="text-foreground">PDF, PNG, JPG, JPEG, WEBP</span>
            </li>
            <li>All fields marked with * are required</li>
            <li>Ensure the note is clear and readable before uploading</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default UploadNotePage
