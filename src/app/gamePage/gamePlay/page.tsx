'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import CoachPopup, { PlayStyle } from '@/components/CoachPopup'

interface GameState {
  homeScore: number
  awayScore: number
  quarter: number
  timeLeft: number // in seconds (10 minutes = 600 seconds)
  possession: 'home' | 'away'
  isPlaying: boolean
  gameEnded: boolean
}

interface GameEvent {
  id: number
  time: string
  quarter: number
  event: string
  team: 'home' | 'away' | 'neutral'
  points?: number
}

const GamePlay = () => {
  const [gameState, setGameState] = useState<GameState>({
    homeScore: 0,
    awayScore: 0,
    quarter: 1,
    timeLeft: 6, // 10 minutes in seconds    possession: 'home',
    isPlaying: false,
    gameEnded: false
  })

  const [gameEvents, setGameEvents] = useState<GameEvent[]>([])
  const [eventCounter, setEventCounter] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [showCoachPopup, setShowCoachPopup] = useState(false)
  const [currentStrategy, setCurrentStrategy] = useState<PlayStyle | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Teams data
  const teams = {
    home: { name: "Lakers", color: "purple", logo: "🏀" },
    away: { name: "Warriors", color: "blue", logo: "⚡" }
  }

  // Format time to MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Generate random game events
  const generateGameEvent = (): GameEvent => {
    const events = [
      { event: "2-point field goal", points: 2 },
      { event: "3-point field goal", points: 3 },
      { event: "Free throw", points: 1 },
      { event: "Missed shot", points: 0 },
      { event: "Turnover", points: 0 },
      { event: "Defensive rebound", points: 0 },
      { event: "Offensive rebound", points: 0 },
      { event: "Steal", points: 0 },
      { event: "Block", points: 0 },
      { event: "Assist", points: 0 }
    ]

    const randomEvent = events[Math.floor(Math.random() * events.length)]
    const team = Math.random() > 0.5 ? 'home' : 'away'
    
    return {
      id: eventCounter,
      time: formatTime(gameState.timeLeft),
      quarter: gameState.quarter,
      event: randomEvent.event,
      team: randomEvent.points > 0 ? team : 'neutral',
      points: randomEvent.points
    }
  }

  // Start/Stop game simulation
  const toggleSimulation = () => {
    if (gameState.gameEnded) return

    if (!gameState.isPlaying) {
      setGameState(prev => ({ ...prev, isPlaying: true }))
      setIsSimulating(true)
        intervalRef.current = setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 0) {
            // Show coach popup when timer reaches 0
            setShowCoachPopup(true)
            setIsSimulating(false)
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
            }
            
            if (prev.quarter >= 4) {
              return { ...prev, isPlaying: false, gameEnded: true }
            } else {
              return { 
                ...prev, 
                isPlaying: false,
                quarter: prev.quarter + 1, 
                timeLeft: 600 // Reset to 10 minutes for next quarter
              }
            }
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 }
        })

        // Generate game event every 3-5 seconds
        if (Math.random() > 0.7) {
          const event = generateGameEvent()
          setGameEvents(prev => [event, ...prev])
          setEventCounter(prev => prev + 1)

          // Update score if points were scored
          if (event.points && event.points > 0) {
            setGameState(prev => ({
              ...prev,
              homeScore: event.team === 'home' ? prev.homeScore + event.points! : prev.homeScore,
              awayScore: event.team === 'away' ? prev.awayScore + event.points! : prev.awayScore,
              possession: event.team === 'home' ? 'away' : 'home'
            }))
          }
        }
      }, 1000)
    } else {
      setGameState(prev => ({ ...prev, isPlaying: false }))
      setIsSimulating(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }
  // Reset game
  const resetGame = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setGameState({
      homeScore: 0,
      awayScore: 0,
      quarter: 1,
      timeLeft: 600,
      possession: 'home',
      isPlaying: false,
      gameEnded: false
    })
    setGameEvents([])
    setEventCounter(0)
    setIsSimulating(false)
    setShowCoachPopup(false)
    setCurrentStrategy(null)
  }

  // Handle strategy selection from coach popup
  const handleStrategySelect = (strategy: PlayStyle) => {
    setCurrentStrategy(strategy)
    setShowCoachPopup(false)
    // Continue to next quarter if not final quarter
    if (gameState.quarter < 4) {
      setGameState(prev => ({ ...prev, isPlaying: false }))
    }
  }

  // Handle coach popup close
  const handleCoachPopupClose = () => {
    setShowCoachPopup(false)
    // Continue to next quarter if not final quarter
    if (gameState.quarter < 4) {
      setGameState(prev => ({ ...prev, isPlaying: false }))
    }
  }

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-purple-900 relative overflow-hidden">
      {/* Background Court Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Navigation Button */}
      <div className="absolute top-8 left-8 z-20">
        <Link href="/gamePage/mainMenu">
          <motion.div
            className="bg-white/10 backdrop-blur-lg hover:bg-white/20 p-3 rounded-xl border border-white/20 shadow-xl transition-all group cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image 
              src="/runner.svg" 
              alt="Back to Main Menu" 
              width={24} 
              height={24} 
              className="w-6 h-6 text-white group-hover:scale-110 transition-transform" 
            />
          </motion.div>
        </Link>
      </div>

      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
            GAME SIMULATION
          </h1>
          <p className="text-white/80 text-lg">Real-time Basketball Game Experience</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scoreboard */}
          <motion.div 
            className="lg:col-span-2 bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">SCOREBOARD</h2>
              
              {/* Timer and Quarter */}
              <div className="flex justify-center items-center space-x-8 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold text-orange-400">
                    {formatTime(gameState.timeLeft)}
                  </div>
                  <div className="text-white/60 text-sm">TIME LEFT</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400">
                    Q{gameState.quarter}
                  </div>
                  <div className="text-white/60 text-sm">QUARTER</div>
                </div>
              </div>

              {/* Teams and Scores */}
              <div className="flex justify-between items-center bg-white/5 rounded-xl p-6">
                <div className="text-center flex-1">
                  <div className="text-6xl mb-2">{teams.home.logo}</div>
                  <div className="text-2xl font-bold text-white mb-2">{teams.home.name}</div>
                  <div className="text-5xl font-bold text-purple-400">{gameState.homeScore}</div>
                  {gameState.possession === 'home' && (
                    <div className="text-orange-400 text-sm mt-2 animate-pulse">● POSSESSION</div>
                  )}
                </div>
                
                <div className="text-4xl text-white/40 mx-8">VS</div>
                
                <div className="text-center flex-1">
                  <div className="text-6xl mb-2">{teams.away.logo}</div>
                  <div className="text-2xl font-bold text-white mb-2">{teams.away.name}</div>
                  <div className="text-5xl font-bold text-blue-400">{gameState.awayScore}</div>
                  {gameState.possession === 'away' && (
                    <div className="text-orange-400 text-sm mt-2 animate-pulse">● POSSESSION</div>
                  )}
                </div>
              </div>
            </div>

            {/* Game Controls */}
            <div className="flex justify-center space-x-4">
              <motion.button
                onClick={toggleSimulation}
                disabled={gameState.gameEnded}
                className={`px-8 py-3 rounded-xl font-bold text-white transition-all ${
                  gameState.gameEnded 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : gameState.isPlaying 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                }`}
                whileHover={!gameState.gameEnded ? { scale: 1.05 } : {}}
                whileTap={!gameState.gameEnded ? { scale: 0.95 } : {}}
              >
                {gameState.gameEnded ? 'GAME ENDED' : gameState.isPlaying ? 'PAUSE' : 'START'}
              </motion.button>
              
              <motion.button
                onClick={resetGame}
                className="px-8 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold text-white transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                RESET
              </motion.button>
            </div>

            {gameState.gameEnded && (
              <motion.div 
                className="mt-6 text-center p-4 bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-xl border border-orange-400/30"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-2xl font-bold text-white mb-2">GAME OVER!</h3>
                <p className="text-orange-400">
                  {gameState.homeScore > gameState.awayScore 
                    ? `${teams.home.name} wins ${gameState.homeScore}-${gameState.awayScore}!`
                    : gameState.awayScore > gameState.homeScore
                    ? `${teams.away.name} wins ${gameState.awayScore}-${gameState.homeScore}!`
                    : `It's a tie ${gameState.homeScore}-${gameState.awayScore}!`
                  }
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Game Events / Play-by-Play */}
          <motion.div 
            className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">LIVE PLAY-BY-PLAY</h3>
            
            <div className="h-96 overflow-y-auto space-y-3 custom-scrollbar">
              <AnimatePresence>
                {gameEvents.length === 0 ? (
                  <div className="text-center text-white/60 mt-8">
                    <div className="text-4xl mb-4">🏀</div>
                    <p>Game events will appear here</p>
                    <p className="text-sm">Start the simulation to begin!</p>
                  </div>                ) : (
                  gameEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className={`p-3 rounded-lg border-l-4 ${
                        event.team === 'home' 
                          ? 'bg-purple-500/20 border-purple-400' 
                          : event.team === 'away'
                          ? 'bg-blue-500/20 border-blue-400'
                          : 'bg-gray-500/20 border-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-white font-medium">
                            {event.team !== 'neutral' && (
                              <span className={`font-bold ${
                                event.team === 'home' ? 'text-purple-400' : 'text-blue-400'
                              }`}>
                                {event.team === 'home' ? teams.home.name : teams.away.name}:{' '}
                              </span>
                            )}
                            {event.event}
                            {event.points && event.points > 0 && (
                              <span className="text-orange-400 font-bold"> (+{event.points})</span>
                            )}
                          </div>
                          <div className="text-white/60 text-xs mt-1">
                            Q{event.quarter} - {event.time}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Game Status Indicator */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {isSimulating && (
            <div className="inline-flex items-center space-x-2 bg-green-500/20 border border-green-400/30 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">SIMULATION RUNNING</span>
            </div>
          )}        </motion.div>
      </div>

      {/* Coach Popup */}
      <CoachPopup
        isOpen={showCoachPopup}
        onSelectStrategy={handleStrategySelect}
        onClose={handleCoachPopupClose}
      />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  )
}

export default GamePlay