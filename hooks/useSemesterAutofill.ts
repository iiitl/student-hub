import React, { useEffect } from 'react'
import { Session } from 'next-auth'

export function useSemesterAutofill<
  T extends { year: string; semester: string },
>(
  session: Session | null,
  year: string,
  semester: string,
  setFormData: React.Dispatch<React.SetStateAction<T>>
) {
  useEffect(() => {
    if (!session?.user?.email) return

    const yearMatch = session.user.email.match(/20\d{2}/)
    const batchYear = yearMatch ? yearMatch[0] : ''
    if (!batchYear) return

    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    const yearDiff = currentYear - parseInt(batchYear, 10)
    let calcSem = currentMonth >= 8 ? yearDiff * 2 + 1 : yearDiff * 2
    calcSem = Math.min(8, Math.max(1, calcSem))

    if (year === '' && semester === '') {
      setFormData((prev) => ({
        ...prev,
        year: batchYear,
        semester: String(calcSem),
      }))
    }
  }, [session, year, semester, setFormData])
}
