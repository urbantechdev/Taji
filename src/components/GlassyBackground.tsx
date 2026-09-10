import { motion } from 'motion/react';

export default function GlassyBackground() {
  return (
    <div className="hidden lg:block fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Cloud Motion Shadow Layer 1 - Silent Rainbow Flow (Desktop Only) */}
      <motion.div
        animate={{
          x: ['-5vw', '15vw', '-10vw', '-5vw'],
          y: ['-5vh', '10vh', '15vh', '-5vh'],
          scale: [1, 1.25, 0.9, 1],
          opacity: [0.25, 0.45, 0.3, 0.25],
          filter: [
            'hue-rotate(0deg) blur(70px)',
            'hue-rotate(120deg) blur(90px)',
            'hue-rotate(240deg) blur(75px)',
            'hue-rotate(360deg) blur(70px)'
          ]
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-24 -left-24 w-[700px] h-[500px] rounded-[50%_40%_60%_50%/40%_60%_40%_60%] bg-gradient-to-r from-red-400/20 via-yellow-400/15 via-green-400/20 via-blue-400/20 to-purple-500/20 shadow-[0_50px_100px_rgba(255,100,100,0.1)]"
      />

      {/* Cloud Motion Shadow Layer 2 - Floating Secondary Cloud Drift */}
      <motion.div
        animate={{
          x: ['10vw', '-15vw', '5vw', '10vw'],
          y: ['10vh', '-12vh', '5vh', '10vh'],
          scale: [1, 1.15, 0.95, 1],
          opacity: [0.2, 0.4, 0.25, 0.2],
          filter: [
            'hue-rotate(360deg) blur(80px)',
            'hue-rotate(240deg) blur(100px)',
            'hue-rotate(120deg) blur(75px)',
            'hue-rotate(0deg) blur(80px)'
          ]
        }}
        transition={{
          duration: 38,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-32 -right-32 w-[750px] h-[550px] rounded-[60%_40%_50%_50%/50%_50%_60%_40%] bg-gradient-to-l from-indigo-400/20 via-teal-300/15 via-pink-400/20 to-[#269453]/20 shadow-[0_60px_120px_rgba(100,150,255,0.1)]"
      />

      {/* Central Morphing Rainbow Cloud Puff Shadow */}
      <motion.div
        animate={{
          x: ['-10vw', '12vw', '-5vw', '-10vw'],
          y: ['5vh', '-10vh', '10vh', '5vh'],
          rotate: [0, 90, 180, 270, 360],
          opacity: [0.15, 0.35, 0.2, 0.15],
          filter: [
            'hue-rotate(0deg) blur(90px)',
            'hue-rotate(180deg) blur(110px)',
            'hue-rotate(360deg) blur(90px)'
          ]
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-[45%_55%_65%_35%/50%_40%_60%_50%] bg-gradient-to-tr from-pink-300/15 via-sky-300/20 to-amber-300/15 shadow-[0_40px_110px_rgba(2,61,23,0.08)]"
      />

      {/* Subtle Light Cloud Dust Particle Shadows */}
      <motion.div
        animate={{
          x: ['-20vw', '80vw'],
          y: ['0vh', '30vh', '10vh', '-10vh'],
          opacity: [0, 0.25, 0.25, 0],
          filter: [
            'hue-rotate(0deg) blur(60px)',
            'hue-rotate(360deg) blur(80px)'
          ]
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute top-1/4 left-0 w-[400px] h-[250px] rounded-full bg-gradient-to-r from-purple-300/20 via-pink-300/20 to-cyan-300/20"
      />

      {/* Glass Shimmer Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.7),rgba(255,255,255,0))] pointer-events-none" />
    </div>
  );
}
