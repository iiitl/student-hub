export type TypeNote = {
  subject: string
  subjectCode: string
  batch: number
  semester: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  exam: 'Mid' | 'End' | 'Both'
  url: string
  viewUrl?: string
  fileName?: string
  fileType?: string
  id?: string
  uploadedBy: string
  description?: string
  facultyName: string
}
