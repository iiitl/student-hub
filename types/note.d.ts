export type NoteCategory = 'academic' | 'axios'

export type AxiosWing =
  | 'ML'
  | 'Web3'
  | 'Web'
  | 'FOSS'
  | 'InfoSec'
  | 'Design'
  | 'App'
  | 'CP'

export type AxiosAudience =
  | '1st Year'
  | '2nd Year'
  | '3rd Year'
  | '4th Year'
  | 'All'

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
  id: string
  uploadedBy: string
  description?: string
  facultyName: string
  category?: NoteCategory
  // Axios-specific fields
  wing?: AxiosWing
  targetAudience?: AxiosAudience
  presenterName?: string
}
