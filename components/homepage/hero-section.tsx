"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

// Animated SVG Triangle Component
import type { TargetAndTransition, Transition } from 'framer-motion'

interface AnimatedTriangleProps {
  className?: string
  style?: React.CSSProperties
  animationProps: {
    animate: TargetAndTransition
    transition: Transition
  }
  colorVar: string
}

const AnimatedTriangle: React.FC<AnimatedTriangleProps> = ({ className, style, animationProps, colorVar }) => (
  <motion.svg
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
    animate={animationProps.animate}
    transition={animationProps.transition}
  >
    <polygon
      points="100,10 195,195 5,195"
      fill="none"
      stroke={`var(${colorVar})`}
      strokeWidth="5"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </motion.svg>
)

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.3 } }
}

const item = {
  hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8 } }
}

const HeroSection: React.FC = () => {
  const [showTriangles, setShowTriangles] = useState(false);

  // Triangle pop-in animation variants
  const trianglePop = {
    hidden: { opacity: 0, scale: 0.7 },
    visible: (delay: number) => ({
      opacity: 1,
      scale: 1,
      transition: { delay, duration: 0.5, type: 'spring' as const, stiffness: 200, damping: 18 }
    })
  };

  return (
    <section
      className="min-h-[100vh] py-8 md:py-20 relative overflow-hidden text-black dark:text-gray-300"
      style={{
        '--tri': 'rgba(30,41,59,0.7)',
        '--tri-dark': 'rgba(191,219,254,0.7)',
      } as React.CSSProperties}
    >
      <style>{`
        @media (prefers-color-scheme: dark) {
          section[style] { --tri: var(--tri-dark) !important; }
        }
      `}</style>
      {/* Background Triangles - appear after button animation */}
      {showTriangles && (
      <>
        <motion.div
        initial="hidden"
        animate="visible"
        variants={trianglePop}
        custom={0}
        className="absolute top-0 left-[-10%] w-[60vw] sm:w-[40vw] opacity-20"
        style={{ zIndex: 0 }}
        >
        <AnimatedTriangle
          className="w-full h-full"
          colorVar="--tri"
          animationProps={{
          animate: { x: [0, 50, 0], rotate: [0, 30, 0] },
          transition: { repeat: Infinity, duration: 20, ease: 'easeInOut' }
          }}
        />
        </motion.div>
        <motion.div
        initial="hidden"
        animate="visible"
        variants={trianglePop}
        custom={0.3}
        className="absolute bottom-0 left-[10%] w-[40vw] sm:w-[22vw] opacity-25"
        style={{ zIndex: 0 }}
        >
        <AnimatedTriangle
          className="w-full h-full"
          colorVar="--tri"
          animationProps={{
          animate: { y: [0, -40, 0], rotate: [0, -30, 0] },
          transition: { repeat: Infinity, duration: 25, ease: 'easeInOut' }
          }}
        />
        </motion.div>
        <motion.div
        initial="hidden"
        animate="visible"
        variants={trianglePop}
        custom={0.6}
        className="absolute top-[30%] right-[-5%] w-[32vw] sm:w-[18vw] opacity-15"
        style={{ zIndex: 0 }}
        >
        <AnimatedTriangle
          className="w-full h-full"
          colorVar="--tri"
          animationProps={{
          animate: { x: [0, -60, 0], y: [0, 60, 0] },
          transition: { repeat: Infinity, duration: 30, ease: 'easeInOut' }
          }}
        />
        </motion.div>
      </>
      )}
      <motion.div
        className="container mx-auto px-4 text-left relative z-10 flex flex-col items-start justify-center min-h-[60vh]"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h1 variants={item} className="text-2xl sm:text-3xl font-semibold mb-1 dark:text-white">
          One Platform. Every Student Needs.
        </motion.h1>
        <motion.h1 variants={item} className="text-4xl sm:text-6xl font-bold mb-6 dark:text-white">
          By the Students, For the Students
        </motion.h1>
        <motion.h1 variants={item} className="text-base sm:text-xl mx-1 mb-4 dark:text-white">
          Resources, community, and expert support to guide you<br className="hidden sm:block" />through academics, opportunities, and campus life — all in one place.
        </motion.h1>
        <motion.div
          variants={item}
          className="flex flex-wrap justify-start mt-4"
          onAnimationComplete={() => setShowTriangles(true)}
        >
          <Button
            size="lg"
            asChild
            className="bg-black text-white dark:bg-white dark:text-black
              hover:bg-transparent hover:text-black hover:border-2 hover:border-black
              dark:hover:bg-transparent dark:hover:text-white dark:hover:border-white
              rounded-lg transition-all duration-300 hover:scale-105 text-base sm:text-lg px-6 py-3"
          >
            <Link href="/newcomers">Explore</Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default HeroSection;
