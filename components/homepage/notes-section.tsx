"use client"
import React from 'react'
import Link from "next/link"
import {useTransform,useScroll, motion, MotionValue} from "framer-motion"
import { Button } from '@/components/ui/button'
import useDimensions from '@/hooks/useDimensions'
import Image from 'next/image'
import { useRef } from 'react'

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06 // faster letter animation
    }
  }
};

const letterVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 500, damping: 30, duration: 0.18 } } // faster
};

const fadeInVariant = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7 } }
};

const buttonVariant = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, stiffness: 120, type: "spring" as const } }
};

const NotesSection = ()=>{
    const title = `Study Materials`;


    const images = [
        "1.jpeg",
        "2.jpeg",
        "3.jpeg",
        "4.jpeg",
        "5.jpeg",
        "6.jpeg",
        "7.jpeg",
        "8.jpeg",
        "9.jpeg",
        "10.jpeg",
        "11.jpeg", 
        "12.jpeg",
    ];
    const container  = useRef(null);
    const {height} = useDimensions();
    const {scrollYProgress} = useScroll({
        target: container,
        offset:['start end', 'end start']
    });
    const y = useTransform(scrollYProgress, [0, 1], [0, height * 0.2]);
    const y1 = useTransform(scrollYProgress, [0, 1], [0, height * 0.35]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, height * 0.15]);


    type ColumnProps = {
      images: string[];
      y?: MotionValue<number>;
      top?: string; // new prop for custom top offset
    }; 
const Column: React.FC<ColumnProps> = ({ images, y = undefined, top = '0%' }) => (
<motion.div
  style={{ y, translateY: top }}
  className="w-full h-full flex flex-col gap-[2vw] relative"
>
  {images.map((src, index) => (
    <div key={index} className="w-full min-h-[40vh] relative overflow-hidden">
      <Image
        src={`/notesgall/${src}`}
        alt="image"
        fill
        className="object-cover"
      />
    </div>
  ))}
</motion.div>

);




    return(
        <section className="py-8 md:py-20 relative">
            <div className='flex flex-col md:flex-row justify-between px-2 md:px-4 w-full gap-8'>
                <motion.div
                  className='w-full md:w-1/2 h-auto md:h-screen flex flex-col justify-center items-start px-2 md:px-8 mb-8 md:mb-0 dark:text:gray-200'
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                {/* Left */}
                <h1 className='text-3xl sm:text-6xl mb-2 font-semibold flex'>
                  {title.split("").map((char, i) => (
                    <motion.span key={i} variants={letterVariants} style={{ display: char === " " ? "inline-block" : undefined }}>{char}</motion.span>
                  ))}
                </h1>
                <motion.p className='text-base sm:text-l mb-6' variants={fadeInVariant}>
                  Find all the study material you need to ace the next exam, from Notes to Previous Year Papers,<br className="hidden sm:block"/>We have it all!
                </motion.p>
                <motion.div variants={buttonVariant}>
                <Button
                className="bg-black text-white dark:bg-white dark:text-black 
                            rounded-full w-28 h-16 sm:w-32 sm:h-32 
                            hover:bg-transparent hover:text-black hover:border-black hover:border-2
                            dark:hover:bg-transparent dark:hover:text-white dark:hover:border-white 
                            transition-all duration-500 hover:scale-110 text-base sm:text-xl">
                <Link href="/papers">Explore</Link>
                </Button>

                </motion.div>
                </motion.div>

                <div className="w-full md:w-1/2 h-[60vw] md:h-screen flex flex-col justify-center items-center px-2 md:px-8">
                {/* Right */}
                <div
                ref={container}
                id="note-gallery"
                className='overflow-x-auto md:overflow-hidden m-0 h-full w-full flex flex-row gap-[2vw] box-border bg-black/30 rounded-lg'
                >
                    <Column images={[images[0], images[1], images[2], images[3]]} y={y} top='-40%' />
                    <Column images={[images[4], images[5], images[6], images[7]]} y={y1} top='-20%' />
                    <Column images={[images[8], images[9], images[10], images[11]]} y={y2} top='-10%' />
                </div>
            </div>
            </div>
        </section>
    );
}

export default NotesSection;