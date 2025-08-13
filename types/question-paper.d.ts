export type TypeQuestionPaper = {
  /** The full name of the subject */
  subject: string
  /** The short code used to identify the subject */
  subjectCode: string
  /** The batch to which the question paper belongs */
  batch: number
  /** The semester number (1-8) */
  semester: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  /** The paper is of which semester half */
  exam: 'Mid' | 'End' | 'Both' | 'Class_test_1' | 'Class_test_2' | 'Class_test_3'
  /** The URL or path to the question paper file */
  url: string
  /** The URL or path to view the question paper */
  viewUrl?: string
}
