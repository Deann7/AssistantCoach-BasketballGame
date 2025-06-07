'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface Team {
  name: string
  score: number
  logo: string
  color: string
}

interface ScoreboardProps {
  homeTeam: Team
  awayTeam: Team
  timeLeft: number
  quarter: number
  possession?: 'home' | 'away'
  isPlaying?: boolean
  className?: string
}

const Scoreboard: React.FC<ScoreboardProps> = ({
  homeTeam,
  awayTeam,
  timeLeft,
  quarter,
  possession,
  isPlaying = false,
  className = ""
}) => {
  // Format time to MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div 
      className={`bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-6 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-4 bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
          SCOREBOARD
        </h2>
        
        {/* Timer and Quarter */}
        <div className="flex justify-center items-center space-x-8 mb-6">
          <div className="text-center">
            <motion.div 
              className={`text-4xl font-mono font-bold ${
                timeLeft <= 60 ? 'text-red-400 animate-pulse' : 'text-orange-400'
              }`}
              animate={timeLeft <= 60 ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {formatTime(timeLeft)}
            </motion.div>
            <div className="text-white/60 text-sm">TIME LEFT</div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400">
              Q{quarter}
            </div>
            <div className="text-white/60 text-sm">QUARTER</div>
          </div>
          
          {isPlaying && (
            <div className="text-center">
              <motion.div 
                className="w-4 h-4 bg-green-400 rounded-full mx-auto"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <div className="text-green-400 text-sm mt-1">LIVE</div>
            </div>
          )}
        </div>
      </div>

      {/* Teams and Scores */}
      <div className="flex justify-between items-center bg-white/5 rounded-xl p-6">
        {/* Home Team */}
        <motion.div 
          className="text-center flex-1"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-6xl mb-2">{homeTeam.logo}</div>
          <div className="text-2xl font-bold text-white mb-2">{homeTeam.name}</div>
          <motion.div 
            className={`text-5xl font-bold ${homeTeam.color === 'purple' ? 'text-purple-400' : 'text-blue-400'}`}
            key={homeTeam.score}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {homeTeam.score}
          </motion.div>
          {possession === 'home' && (
            <motion.div 
              className="text-orange-400 text-sm mt-2 flex items-center justify-center"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
              POSSESSION
            </motion.div>
          )}
        </motion.div>
        
        {/* VS Divider */}
        <div className="text-4xl text-white/40 mx-8 font-bold">VS</div>
        
        {/* Away Team */}
        <motion.div 
          className="text-center flex-1"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-6xl mb-2">{awayTeam.logo}</div>
          <div className="text-2xl font-bold text-white mb-2">{awayTeam.name}</div>
          <motion.div 
            className={`text-5xl font-bold ${awayTeam.color === 'blue' ? 'text-blue-400' : 'text-purple-400'}`}
            key={awayTeam.score}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {awayTeam.score}
          </motion.div>
          {possession === 'away' && (
            <motion.div 
              className="text-orange-400 text-sm mt-2 flex items-center justify-center"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
              POSSESSION
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Additional Stats Row */}
      <div className="mt-4 flex justify-center space-x-8 text-sm text-white/60">
        <div className="text-center">
          <div className="text-white font-bold">
            {homeTeam.score > awayTeam.score ? homeTeam.name : awayTeam.score > homeTeam.score ? awayTeam.name : 'TIE'}
          </div>
          <div>LEADING</div>
        </div>
        <div className="text-center">
          <div className="text-white font-bold">
            {Math.abs(homeTeam.score - awayTeam.score)}
          </div>
          <div>POINT DIFF</div>
        </div>
      </div>
    </motion.div>
  )
}

export default Scoreboard