"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import MusicPlayer from '@/components/MusicPlayer';

const MainMenu = () => {
  const coachName = "Dean"; // You can fetch this from API or context later
  const [isClient, setIsClient] = useState(false);
  
  // Coach trust status - you can modify these values or fetch from API
  const coachTrustData = {
    goodEmotion: 75, // 0-100 scale
    badEmotion: 25,  // 0-100 scale
    satisfaction: 85 // 0-100 scale
  };

  useEffect(() => {
    // This helps with hydration issues
    setIsClient(true);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      }
    }
  };

  const menuItems = [
    {
      title: 'Game Play',
      description: 'Start coaching your team in a live game',
      icon: '/court.svg',
      link: '/gamePage/gamePlay'
    },
    {
      title: 'Management Plan',
      description: 'Develop strategies and manage your team',
      icon: '/jerseyBasketball.svg',
      link: '/gamePage/managementPlan'
    },
    {
      title: 'Standings',
      description: 'View league standings and stats',
      icon: '/standings.svg',
      link: '/gamePage/standings'
    },
    {
      title: 'Exit Game',
      description: 'Return to main menu',
      icon: '/exit.svg',
      link: '/'
    }
  ];

  if (!isClient) {
    return null; // Prevents hydration errors
  }
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 px-4 py-12 overflow-hidden">
      {/* Music Player Component */}
      <MusicPlayer />
      
      {/* Basketball background elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
      
      {/* Basketball court lines (decorative) */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/70" />
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/70" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 border-4 border-white/70 rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Main content */}
      <motion.div 
        className="container mx-auto max-w-5xl relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header section */}
        <motion.div 
          className="text-center mb-12" 
          variants={itemVariants}
        >
          <div className="flex justify-center mb-6">
            <Image 
              src="/basketball.svg" 
              alt="Basketball" 
              width={80} 
              height={80} 
              className="animate-bounce" 
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Assistant Coach Dashboard
          </h1>
          <p className="text-xl md:text-2xl text-orange-300 font-semibold">
            Welcome Back, Assistant Coach {coachName}
          </p>
        </motion.div>

        {/* Menu grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {menuItems.map((item, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href={item.link}>
                <div className="bg-white/10 backdrop-blur-lg hover:bg-white/20 p-6 rounded-2xl border border-white/20 shadow-xl transition-all group">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-br from-orange-400 to-red-500 p-3 rounded-xl shadow-lg group-hover:shadow-orange-500/30 transition-all">
                      <Image 
                        src={item.icon} 
                        alt={item.title} 
                        width={40} 
                        height={40} 
                        className="w-10 h-10" 
                      />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                        {item.title}
                      </h2>
                      <p className="text-gray-300">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>        {/* Footer section */}
        <div className='flex flex-row gap-8 max-md:flex-col items-center justify-center mt-12'>
          {/* Coach Image */}
          <div className='mb-8'>
             <Image 
              src="/coach_image.png" 
              alt="Coach John Doe" 
              width={160} 
              height={200} 
            />
          </div>
          
          {/* Coach Trust Status */}
          <motion.div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl w-full max-w-2xl"
            variants={itemVariants}
          >            <h3 className="text-2xl font-bold text-white mb-6 text-center">
             Emotion Bar
            </h3>
            
            <div className='grid grid-cols-2 gap-6'>
              {/* Good Emotion Bar */}
              <div className="flex flex-col items-center">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">😊</span>
                  <span className="text-white font-semibold">Good Emotion</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center"
                    initial={{ width: 0 }}
                    animate={{ width: `${coachTrustData.goodEmotion}%` }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  >
                    <span className="text-white text-sm font-bold">{coachTrustData.goodEmotion}%</span>
                  </motion.div>
                </div>
              </div>
              
              {/* Bad Emotion Bar */}
              <div className="flex flex-col items-center">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">😠</span>
                  <span className="text-white font-semibold">Bad Emotion</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center"
                    initial={{ width: 0 }}
                    animate={{ width: `${coachTrustData.badEmotion}%` }}
                    transition={{ duration: 1.5, delay: 0.7 }}
                  >
                    <span className="text-white text-sm font-bold">{coachTrustData.badEmotion}%</span>
                  </motion.div>
                </div>
              </div>
              </div>
             
              {/* Satisfaction Level */}
            <div className="mt-6 text-center">
              <p className="text-gray-300 text-sm mb-2">Satisfaction Level</p>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-3xl">⭐</span>
                <span className="text-2xl font-bold text-orange-300">
                  {coachTrustData.satisfaction}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default MainMenu;