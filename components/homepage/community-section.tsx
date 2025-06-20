"use client";
import React, { useEffect, useState } from 'react';
import { useTransform, useScroll, motion, MotionValue } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import useDimensions from '@/hooks/useDimensions';
import { Button } from '../ui/button';
import Link from 'next/link';


const CommunitySection = () =>{
    
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
    const [parallaxMultipliers, setParallaxMultipliers] = useState([2, 3.3, 1.25, 3]);
    const [columnTops, setColumnTops] = useState<string[]>(['-45%', '-95%', '-45%', '-75%']);

    useEffect(() => {
      const updateResponsiveParallax = () => {
        const width = window.innerWidth;
        if (width < 640) {
          setParallaxMultipliers([0.7, 1.2, 0.4, 1]);
          setColumnTops(['-60vw', '-90vw', '-20vw', '-70vw']);
        } else if (width < 1024) {
          setParallaxMultipliers([1.2, 2, 0.7, 1.5]);
          setColumnTops(['-30vw', '-60vw', '-15vw', '-40vw']);
        } else {
          setParallaxMultipliers([2, 3.3, 1.25, 3]);
          setColumnTops(['-45%', '-95%', '-45%', '-75%']);
        }
      };
      updateResponsiveParallax();
      window.addEventListener('resize', updateResponsiveParallax);
      return () => window.removeEventListener('resize', updateResponsiveParallax);
    }, []);

    const y = useTransform(scrollYProgress, [0, 1], [0, height * parallaxMultipliers[0]]);
    const y1 = useTransform(scrollYProgress, [0, 1], [0, height * parallaxMultipliers[1]]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, height * parallaxMultipliers[2]]);
    const y3 = useTransform(scrollYProgress, [0, 1], [0, height * parallaxMultipliers[3]]);






type ColumnProps = {
  images: string[];
  y?: MotionValue<number>;
  top?: string; // new prop for custom top offset
};

const Column: React.FC<ColumnProps> = ({ images, y = undefined, top = '0%' }) => (
  <motion.div
    style={{ y, top }}
    className='w-1/4 h-full flex flex-col gap-[2vw] relative'
  >
    {
      images.map((src, index) => (
        <div key={index} className='w-full h-full relative overflow-hidden'>
          <Image
            src={`/community-gallery/${src}`}
            alt={`Community gallery image ${index + 1}`}
            fill
            className='rounded-[1vw] object-cover'
          />
        </div>
      ))
    }
  </motion.div>
);


return (
  <>
    <section className='relative overflow-hidden min-h-[70vh] md:h-[95vh]'>
      {/* Overlay with Text */}
      <div className='absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-2 sm:px-4 dark:text-white'>
        <h1 className='text-transparent bg-gradient-to-r from-purple-700 via-pink-600 to-yellow-400 bg-clip-text text-3xl sm:text-6xl font-bold mb-6'>
          Join Our Community
        </h1>
        <p className='text-base sm:text-lg md:text-xl'>
          Connect with fellow students, share resources, and make your college experience better.
        </p>
          <Link href="/chat">
            <Button
              size="lg"
              className="bg-black text-white dark:bg-white dark:text-black 
                        rounded-lg hover:scale-110 transition-transform mt-4 
                        hover:bg-transparent hover:border-black hover:text-black hover:border-2
                        dark:hover:bg-transparent dark:hover:border-white dark:hover:text-white 
                        text-base sm:text-lg px-6 py-3 duration-500"
            >
              Start Chatting
            </Button>
          </Link>

      </div>

      {/* Overlay with Background */}
      <div className='absolute inset-0 bg-blue-200/60 dark:bg-black/70 z-20'></div>

      {/* Main Content with Parallax */}
      <div className='relative z-10 w-full h-full'>
        <div
          ref={container}
          id="gallery"
          className='overflow-x-auto md:overflow-hidden m-0 h-[120vw] md:h-[175vh] bg-blue-100 dark:bg-slate-800 flex flex-row gap-[2vw] p-[2vw] box-border rounded-lg'
        >
          <Column images={[images[0], images[1], images[2]]} y={y} top={columnTops[0]} />
          <Column images={[images[3], images[4], images[5]]} y={y1} top={columnTops[1]} />
          <Column images={[images[6], images[7], images[8]]} y={y2} top={columnTops[2]} />
          <Column images={[images[9], images[10], images[11]]} y={y3} top={columnTops[3]} />
        </div>
      </div>
    </section>
  </>
)


}



export default CommunitySection;