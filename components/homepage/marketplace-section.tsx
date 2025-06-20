import React, { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import Image from 'next/image';
import useDimensions from '@/hooks/useDimensions';


const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06
    }
  }
};

const letterVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 500, damping: 30, duration: 0.18 } }
};

const fadeInVariant = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7 } }
};

const buttonVariant = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, stiffness: 120, type: "spring" as const } }
};

const MarketplaceSection = () => {
  const title = "Marketplace";
  // Gallery logic
  const images = [
    "1.jpeg", "2.jpeg", "3.jpeg", "4.jpeg",
    "5.jpeg", "6.jpeg", "7.jpeg", "8.jpeg",
    "9.jpeg", "10.jpeg", "11.jpeg", "12.jpeg",
  ];
  // Separate refs for left and right galleries
  const leftContainer = useRef(null);
  const { height } = useDimensions();
  // Left gallery scroll
  const { scrollYProgress: leftScrollY } = useScroll({
    target: leftContainer,
    offset: ['start end', 'end start']
  });
  const leftY = useTransform(leftScrollY, [0, 1], [0, height * 0.2]);
  const leftY1 = useTransform(leftScrollY, [0, 1], [0, height * 0.35]);
  const leftY2 = useTransform(leftScrollY, [0, 1], [0, height * 0.15]);
  // Right gallery scroll
  // const { scrollYProgress: rightScrollY } = useScroll({
  //   target: rightContainer,
  //   offset: ['start end', 'end start']
  // });
  // Removed unused rightScrollY

  type ColumnProps = {
    images: string[];
    y?: MotionValue<number>;
    top?: string;
  };
  const Column: React.FC<ColumnProps> = ({ images, y = undefined, top = '0%' }) => (
    <motion.div
      style={{ y, translateY: top }}
      className="w-full h-full flex flex-col gap-[2vw] relative"
    >
      {images.map((src, index) => (
        <div key={index} className="w-full min-h-[40vh] relative overflow-hidden">
          <Image
            src={`/marketgall/${src}`}
            alt="image"
            fill
            className="object-cover"
          />
        </div>
      ))}
    </motion.div>
  );

  return (
    <section className='py-8 md:pt-20 relative'>
        <div className='flex flex-col md:flex-row justify-between px-2 md:px-4 w-full gap-8'>
            {/* Left Side: Gallery */}
            <div className='w-full md:w-1/2 h-[60vw] md:h-screen flex flex-col justify-center items-center px-2 md:px-8 mb-8 md:mb-0'>
              <div
                ref={leftContainer}
                id="market-gallery-left"
                className='overflow-x-auto md:overflow-hidden m-0 h-full w-full flex flex-row gap-[2vw] box-border bg-black/30 rounded-lg'
              >
                <Column images={[images[0], images[1], images[2], images[3]]} y={leftY} top='-40%' />
                <Column images={[images[4], images[5], images[6], images[7]]} y={leftY1} top='-20%' />
                <Column images={[images[8], images[9], images[10], images[11]]} y={leftY2} top='-10%' />
              </div>
            </div>
            {/* Right Side: Text and Button */}
            <motion.div
            className="w-full md:w-1/2 h-auto md:h-screen flex flex-col justify-center items-start px-2 md:px-8 text-black dark:text-gray-200"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            >

            <h1 className='text-3xl sm:text-6xl mb-2 font-semibold flex'>
              {title.split("").map((char, i) => (
                <motion.span key={i} variants={letterVariants} style={{ display: char === " " ? "inline-block" : undefined }}>{char}</motion.span>
              ))}
            </h1>
            <motion.p className='text-base sm:text-l mb-6' variants={fadeInVariant}>
              A campus-wide platform where students can easily buy and sell pre-loved items—whether it’s books, gadgets, furniture, or anything in between.
            </motion.p>
            <motion.div variants={buttonVariant} className="mb-8">
            <Button
            className="bg-black text-white dark:bg-white dark:text-black 
                        rounded-full w-28 h-16 sm:w-32 sm:h-32 
                        hover:bg-transparent hover:text-black hover:border-black hover:border-2
                        dark:hover:bg-transparent dark:hover:text-white dark:hover:border-white 
                        transition-all duration-500 hover:scale-110 text-base sm:text-xl">
            <Link href="/marketplace">Explore</Link>
            </Button>
            </motion.div>
          </motion.div>
        </div>
    </section>
  )
}

export default MarketplaceSection;