"use client";
import React, { use, useEffect } from 'react';
import { useTransform, useScroll, motion } from 'framer-motion';
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
    const y = useTransform(scrollYProgress, [0, 1], [0, height * 2]);
    const y1 = useTransform(scrollYProgress, [0, 1], [0, height * 3.3]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, height * 1.25]);
    const y3 = useTransform(scrollYProgress, [0, 1], [0, height * 3]);






type ColumnProps = {
  images: string[];
  y?: any; // from framer-motion
  top?: string; // new prop for custom top offset
};

const Column: React.FC<ColumnProps> = ({ images, y = 0, top = '0%' }) => (
  <motion.div
    style={{ y, top }}
    className='w-1/4 h-full flex flex-col gap-[2vw] relative'
  >
    {
      images.map((src, index) => (
        <div key={index} className='w-full h-full relative overflow-hidden'>
          <Image
            src={`/commsgall/${src}`}
            alt='image'
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
      <div className='absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-2 sm:px-4'>
        <h1 className='text-transparent bg-gradient-to-r from-purple-700 via-pink-600 to-yellow-400 bg-clip-text text-3xl sm:text-6xl font-bold mb-6'>
          Join Our Community
        </h1>
        <p className='text-base sm:text-lg md:text-xl'>
          Connect with fellow students, share resources, and make your college experience better.
        </p>
          <Button
            size="lg"
            asChild
            className="bg-black text-white rounded-lg hover:scale-110 transition-transform mt-4 hover:bg-black text-base sm:text-lg px-6 py-3"
          >
            <Link href="/chat">Start Chatting</Link>
          </Button>
      </div>

      {/* Overlay with Background */}
      <div className='absolute inset-0 bg-blue-200/60 dark:bg-slate-900/60 z-20'></div>

      {/* Main Content with Parallax */}
      <div className='relative z-10 w-full h-full'>
        <div
          ref={container}
          id="gallery"
          className='overflow-x-auto md:overflow-hidden m-0 h-[120vw] md:h-[175vh] bg-blue-100 dark:bg-slate-800 flex flex-row gap-[2vw] p-[2vw] box-border rounded-lg'
        >
          <Column images={[images[0], images[1], images[2]]} y={y} top='-45%' />
          <Column images={[images[3], images[4], images[5]]} y={y1} top='-95%' />
          <Column images={[images[6], images[7], images[8]]} y={y2} top='-45%' />
          <Column images={[images[9], images[10], images[11]]} y={y3} top='-75%' />
        </div>
      </div>
    </section>
  </>
)


}



export default CommunitySection;