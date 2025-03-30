'use client'
import useContributors from '@/hooks/useContributors'
import ContributorCard from '@/components/contributors/contributor-card'

const Contributors = () => {
  const { contributors, sortBy, setSortBy, error, isLoading } =
    useContributors()

  if (error)
    return (
      <div className="flex min-h-screen w-full justify-center items-center">
        <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg text-center max-w-md">
          <h2 className="text-xl font-bold text-destructive mb-2">
            Unable to load contributors
          </h2>
          <p className="text-destructive/90">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )

  return (
    <div className="flex w-full flex-col bg-gradient-to-b from-background to-muted items-center gap-4 p-4 pt-8 pb-16">
      <h1 className="text-3xl font-bold my-4 text-foreground">
        Our Contributors
      </h1>
      <p className="text-lg text-foreground text-center">
        These are the amazing people who have contributed to this project.
      </p>
      <div className="flex justify-center items-center my-4">
        <label htmlFor="sort-select" className="mr-2">
          Sort By:
        </label>
        <select
          id="sort-select"
          className="p-2 rounded-md bg-background text-foreground"
          onChange={(e) =>
            setSortBy(e.target.value as 'contributions' | 'name')
          }
          value={sortBy}
        >
          <option value="contributions">Contributions</option>
          <option value="name">Name</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-6 justify-center">
        {contributors.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center w-full py-12">
            <p className="text-xl text-foreground text-center">
              No contributors found
            </p>
          </div>
        )}
        {isLoading && (
          <div
            className="flex flex-col items-center justify-center w-full py-12"
            role="status"
          >
            <div
              className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"
              aria-hidden="true"
            ></div>
            <p className="mt-4 text-foreground" aria-live="assertive">
              Loading contributors...
            </p>
          </div>
        )}
        {contributors.length > 0 &&
          contributors.map((contributor) => (
            <ContributorCard key={contributor.id} contributor={contributor} />
          ))}
      </div>
    </div>
  )
}

export default Contributors
