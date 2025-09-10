'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, Calendar, BookOpen, GraduationCap, FileUp } from 'lucide-react'

const UploadPaperPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject: '',
    year: '',
    term: '',
    uploaded_file: null as File | null
  })

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({
      ...prev,
      uploaded_file: file
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement API call
    console.log('Form data:', formData)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload Question Paper</h1>
          <p className="text-muted-foreground">Share your question papers with the student community</p>
        </div>

        <Card className="shadow-lg">
          
          
          <CardContent>
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
                  placeholder="Enter the paper title (e.g.,Data Structure Final Exam 2024)"
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
                  id="title"
                  type="text"
                  placeholder="Enter the subject name"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              {/* Year and Term Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Year Field */}
                <div className="space-y-2">
                  <Label htmlFor="year" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Year *
                  </Label>
                  <Select onValueChange={(value: string) => handleSelectChange('year', value)}>
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

                {/* Term Field */}
                <div className="space-y-2">
                  <Label htmlFor="term" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Semester *
                  </Label>
                  <Select onValueChange={(value: string) => handleSelectChange('term', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      
                      <SelectItem value="semester-1">Semester 1</SelectItem>
                      <SelectItem value="semester-2">Semester 2</SelectItem>
                      <SelectItem value="semester-3">Semester 3</SelectItem>
                      <SelectItem value="semester-4">Semester 4</SelectItem>
                      <SelectItem value="semester-5">Semester 5</SelectItem>
                      <SelectItem value="semester-6">Semester 6</SelectItem>
                      <SelectItem value="semester-7">Semester 7</SelectItem>
                      <SelectItem value="semester-8">Semester 8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* File Upload Field */}
              <div className="space-y-2">
                <Label htmlFor="file" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File *
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
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
                          {formData.uploaded_file ? formData.uploaded_file.name : 'Click to upload file'}
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
                    ✓ File selected: {formData.uploaded_file.name} ({(formData.uploaded_file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Question Paper
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <h4 className="font-medium text-foreground">Upload Guidelines:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Ensure the paper is clear and readable</li>
                <li>• Maximum file size: 25MB</li>
                <li>• Supported formats: PDF, PNG, JPG, JPEG, WEBP</li>
                <li>• All fields marked with * are required</li>
                <li>• Your uploaded paper will be reviewed before publication</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default UploadPaperPage