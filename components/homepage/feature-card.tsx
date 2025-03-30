import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type FeatureCardProps = {
  title: string
  description: string
  link: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  link,
}) => {
  return (
    <Card className="h-full w-fit transition-all hover:shadow-lg hover:scale-105 transform-gpu">
      <CardContent className="p-6 py-0 flex flex-col justify-between h-full">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4 flex-1">{description}</p>
        <Button
          variant="ghost"
          className="justify-start p-5 pb-1 pt-1 rounded-lg bg-accent-foreground hover:bg-accent-foreground text-background hover:text-background transition-colors w-fit"
          asChild
        >
          <Link href={link}>Explore →</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default FeatureCard
