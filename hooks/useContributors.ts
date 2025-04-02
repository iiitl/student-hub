import { useEffect, useState } from 'react'
import { TypeContributors } from '@/types/contributors'

interface TypeRepoDetails {
  owner: string
  repo: string
}

const RepoDetails: TypeRepoDetails = {
  owner: process.env.NEXT_PUBLIC_GITHUB_OWNER || 'iiitl',
  repo: process.env.NEXT_PUBLIC_GITHUB_REPO || 'student-hub',
}

export default function useContributors() {
  const [contributors, setContributors] = useState<TypeContributors[]>([])
  const [sortBy, setSortBy] = useState<'contributions' | 'name'>(
    'contributions'
  )
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    const fetchContributors = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `https://api.github.com/repos/${RepoDetails.owner}/${RepoDetails.repo}/contributors`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch contributors')
        }
        const data = await response.json()
        setContributors(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContributors()
  }, [])

  useEffect(() => {
    setContributors((prev) =>
      [...prev].sort((a, b) =>
        sortBy === 'contributions'
          ? b.contributions - a.contributions
          : a.login.localeCompare(b.login)
      )
    )
  }, [sortBy])

  return { contributors, sortBy, setSortBy, error, isLoading }
}
