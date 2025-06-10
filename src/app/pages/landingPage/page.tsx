"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const LandingPage = () => {
  const [showCredits, setShowCredits] = useState(false);
  const router = useRouter();

  const handleStartClick = () => {
    router.push('/pages/login');
  };

  const handleCreditsClick = () => {
    setShowCredits(true);
  };

  const handleCloseCredits = () => {
    setShowCredits(false);
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-between bg-gray-900 font-burbank relative overflow-hidden">
      {/* Background image with darkened overlay */}
      <div className="absolute inset-0 w-screen h-screen">
        <Image
          src="/LandingPage.png"
          alt="Assistant Coach"
          fill
          className="object-cover object-bottom w-full h-full"
        />
        {/* Dark overlay for better text visibility */}
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>

      {/* Content overlay - repositioned to middle-bottom area */}
      <div className="z-10 flex flex-col items-center justify-end w-full h-full pb-24">
        {/* Title with animation */}
        <motion.h1 
          className="text-5xl md:text-7xl font-extrabold text-white text-center mb-8 tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          Assistant Coach
          <span className="block text-orange-300 mt-2 text-glow">John Doe</span>
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p
          className="text-xl text-gray-200 mb-10 max-w-2xl text-center px-4 drop-shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Become the assistant coach of the Imagine Basketball Team and lead them to victory and get their first championship!
        </motion.p>
        
        {/* Buttons container */}
        <div className="flex flex-col sm:flex-row gap-6 mt-4">
          <motion.button
            onClick={handleStartClick}
            className="px-12 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xl font-bold rounded-lg shadow-xl border-2 border-yellow-400/30"
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 0 25px 5px rgba(245, 158, 11, 0.5)" 
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            START
          </motion.button>
          <motion.button
            onClick={handleCreditsClick}
            className="px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xl font-bold rounded-lg shadow-xl border-2 border-blue-400/30"
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 0 25px 5px rgba(59, 130, 246, 0.5)" 
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            CREDITS
          </motion.button>
        </div>
      </div>
      
      {/* Credits modal */}
      {showCredits && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-lg max-w-md w-full border border-gray-700 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <h2 className="text-2xl font-bold mb-4 text-center text-orange-400">Credits</h2>
            <div className="mb-6 text-gray-300">
              <h3 className="font-bold mb-2 text-white">Main Developer: </h3>
              <p>Deandro Najwan Ahmad Syahbanna</p>
               <p>Computer Engineering</p>
                <p>Sophomore At Universitas Indonesia</p>
              <p className="mt-4 text-gray-400">© 2025 All Rights Reserved</p>
            </div>
            <motion.button
              onClick={handleCloseCredits}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-lg shadow-lg border border-blue-400/30"
              whileHover={{ scale: 1.03, boxShadow: "0 0 15px 2px rgba(59, 130, 246, 0.5)" }}
              whileTap={{ scale: 0.97 }}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default LandingPage;