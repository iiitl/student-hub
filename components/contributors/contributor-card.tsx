import React, { useCallback } from 'react'
import { TypeContributors } from '@/types/contributors'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

type ContributorCardProps = {
  contributor: TypeContributors
}

const ContributorCard: React.FC<ContributorCardProps> = ({ contributor }) => {
  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.target as HTMLImageElement
      target.onerror = null
      target.src =
        'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
    },
    []
  )

  return (
    <Card className="flex items-center container w-full sm:w-48 p-6 gap-4 scale-100 hover:scale-105 transition-transform duration-200 bg-primary/50 ease-in-out shadow-md">
      <div className="relative">
        <Image
          src={contributor.avatar_url}
          alt={contributor.login}
          aria-label={`${contributor.login}'s profile picture`}
          width={128}
          height={128}
          className="w-20 h-20 sm:w-32 sm:h-32 rounded-full object-cover"
          onError={handleImageError}
        />
        <div>
          <span
            className="absolute text-sm font-semibold bg-background bottom-2 right-2 rounded-full w-6 h-6 text-center text-foreground aspect-square"
            title={`${contributor.contributions} contributions`}
            aria-label={`${contributor.contributions} contributions`}
          >
            {contributor.contributions}
          </span>
        </div>
      </div>
      <CardContent className="flex flex-col w-full px-0 text-center">
        <p
          className="text-lg font-semibold font-mono truncate"
          title={`GitHub user: ${contributor.login}`}
        >
          {contributor.login}
        </p>
        <Button
          variant="default"
          className="mt-2 cursor-pointer bg-background text-foreground hover:bg-background/80 w-full"
          aria-label={`View ${contributor.login}'s GitHub profile`}
          onClick={() =>
            window.open(contributor.html_url, '_blank', 'noopener,noreferrer')
          }
        >
          View Profile
        </Button>
      </CardContent>
    </Card>
  )
}

export default ContributorCard
