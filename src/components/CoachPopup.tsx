'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export interface PlayStyle {
  id: 'three_point' | 'inside_post' | 'midrange'
  name: string
  description: string
  icon: string
  color: string
}

interface CoachPopupProps {
  isOpen: boolean
  onSelectStrategy: (strategy: PlayStyle) => void
  onClose: () => void
}

const CoachPopup: React.FC<CoachPopupProps> = ({ isOpen, onSelectStrategy, onClose }) => {
  const playStyles: PlayStyle[] = [
    {
      id: 'three_point',
      name: 'Focus On 3 Point',
      description: 'Prioritize perimeter shooting and three-point attempts',
      icon: '🎯',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'inside_post',
      name: 'Inside Post Play',
      description: 'Dominate the paint with strong post moves',
      icon: '💪',
      color: 'from-red-500 to-rose-600'
    },
    {
      id: 'midrange',
      name: 'Midrange Jumper',
      description: 'Control the game with consistent mid-range shots',
      icon: '🎪',
      color: 'from-blue-500 to-indigo-600'
    }
  ]

  const handleStrategySelect = (strategy: PlayStyle) => {
    onSelectStrategy(strategy)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop/Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Coach Popup Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4, type: "spring", damping: 20 }}
          >
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border-2 border-orange-500/30 shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
              {/* Header with Coach Image */}
              <div className="relative bg-gradient-to-r from-orange-600 to-red-600 p-6 text-center">
                <motion.div
                  className="absolute top-4 right-4 cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                    ✕
                  </div>
                </motion.div>

                <motion.div
                  className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/10 backdrop-blur-lg border-2 border-white/20 flex items-center justify-center overflow-hidden"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Image
                    src="/coach_popup.png"
                    alt="Coach"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </motion.div>

                <motion.h2
                  className="text-2xl font-bold text-white mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  TIMEOUT CALLED!
                </motion.h2>
                <motion.p
                  className="text-white/90 text-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  Choose your strategy for the next quarter
                </motion.p>
              </div>

              {/* Strategy Options */}
              <div className="p-6">
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  {playStyles.map((style, index) => (
                    <motion.button
                      key={style.id}
                      onClick={() => handleStrategySelect(style)}
                      className="w-full group relative overflow-hidden"
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`bg-gradient-to-r ${style.color} p-4 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-white/40`}>
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                            {style.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:scale-105 transition-transform">
                              {style.name}
                            </h3>
                            <p className="text-white/90 text-sm">
                              {style.description}
                            </p>
                          </div>
                          <motion.div
                            className="text-white/60 group-hover:text-white transition-colors"
                            whileHover={{ x: 5 }}
                          >
                            →
                          </motion.div>
                        </div>

                        {/* Hover Effect Overlay */}
                        <motion.div
                          className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
                          initial={false}
                        />
                      </div>
                    </motion.button>
                  ))}
                </motion.div>

                {/* Skip Option */}
                <motion.div
                  className="mt-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <button
                    onClick={onClose}
                    className="text-white/60 hover:text-white text-sm underline transition-colors"
                  >
                    Skip and continue with current strategy
                  </button>
                </motion.div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500"></div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-orange-500 rounded-full opacity-60"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-red-500 rounded-full opacity-40"></div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CoachPopup