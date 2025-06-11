'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useGameEngineEnhanced, GameState, GameEvent, GameTeam } from './GameEngineEnhanced'
import CoachPopup from './CoachPopup'
import GameMusicPlayer from './GameMusicPlayer'
import { Player } from '@/lib/api'
import { motion } from 'framer-motion'
import Image from 'next/image'

// Player Stats Component
const PlayerStats = ({ homeTeam, awayTeam }: {
  homeTeam: GameTeam | null
  awayTeam: GameTeam | null
}) => {
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home')
  const currentTeam = selectedTeam === 'home' ? homeTeam : awayTeam

  if (!currentTeam) return <div className="text-gray-400">No team data available</div>

  return (
    <div className="space-y-4">
      {/* Team selector */}
      <div className="flex space-x-2">
        <button
          onClick={() => setSelectedTeam('home')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            selectedTeam === 'home' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {homeTeam?.teamName || 'Home'}
        </button>
        <button
          onClick={() => setSelectedTeam('away')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            selectedTeam === 'away' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {awayTeam?.teamName || 'Away'}
        </button>
      </div>

      {/* Player stats table */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h4 className="text-lg font-bold text-white mb-3">{currentTeam.teamName} Roster</h4>
        <div className="space-y-2">          {currentTeam.players?.slice(0, 10).map((player: Player, index: number) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {player.playerName?.charAt(0) || 'P'}
                </div>
                <div>
                  <div className="text-white font-medium">{player.playerName || 'Unknown Player'}</div>
                  <div className="text-gray-400 text-sm">{player.playerPosition || 'PG'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-yellow-400 font-bold">{player.playerRating || 50}</div>
                <div className="text-gray-400 text-sm">OVR</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Game Commentary Component
const GameCommentary = ({ gameState, gameEvents }: {
  gameState: GameState
  gameEvents: GameEvent[]
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-white">🎙️ Live Commentary</h3>
        <div className="flex space-x-2">
          <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-semibold">
            Live Game
          </button>
          <button className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-semibold">
            Live Events
          </button>
          <button className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm font-semibold">
            Player Stats
          </button>
        </div>
      </div>

      {/* Current Play */}
      <div className="bg-gray-700/50 rounded-lg p-4 border-l-4 border-orange-400">
        <h4 className="text-orange-400 font-bold mb-2">🔴 LIVE</h4>
        <p className="text-white text-lg">
          {gameState.lastPlay || 'Game is ready to begin...'}
        </p>
      </div>

      {/* Latest Commentary */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <h4 className="text-blue-400 font-bold mb-3">📻 Commentary</h4>
        {gameEvents.length > 0 ? (
          <div className="space-y-3 max-h-40 overflow-y-auto">            {gameEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-start space-x-3 text-sm">
                <div className="text-gray-300 flex-1">
                  <span className="font-semibold">Q{event.quarter}:</span> {event.description || event.event}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">Waiting for game to start...</p>
        )}
      </div>

      {/* Game Status */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <h4 className="text-green-400 font-bold mb-2">🏀 Game Status</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Quarter:</span>
            <span className="text-white font-bold ml-2">Q{gameState.quarter}</span>
          </div>
          <div>
            <span className="text-gray-400">Time:</span>
            <span className="text-white font-bold ml-2">{Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
          <div>
            <span className="text-gray-400">Possession:</span>
            <span className="text-white font-bold ml-2 capitalize">{gameState.possession}</span>
          </div>
          <div>
            <span className="text-gray-400">Status:</span>
            <span className={`font-bold ml-2 ${gameState.isPlaying ? 'text-green-400' : 'text-red-400'}`}>
              {gameState.gameEnded ? 'Ended' : gameState.isPlaying ? 'Playing' : 'Paused'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Live Events Component  
const LiveEvents = ({ gameEvents }: { gameEvents: GameEvent[] }) => {
  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {gameEvents.length > 0 ? (        gameEvents.map((event) => (
          <div key={event.id} className="bg-gray-700/30 rounded-lg p-3 border-l-4 border-blue-400">
            <div className="flex justify-between items-start mb-1">
              {event.points && (
                <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                  +{event.points}
                </span>
              )}
            </div>
            <p className="text-white text-sm leading-relaxed">
              {event.description || event.event}
            </p>
            {event.player && (
              <p className="text-gray-400 text-xs mt-1">
                👤 {event.player}
              </p>
            )}
          </div>
        ))
      ) : (
        <div className="text-center text-gray-400 py-8">
          <div className="text-4xl mb-2">🏀</div>
          <p>Game events will appear here</p>
        </div>
      )}
    </div>
  )
}

// Ball Position Component (Simplified)
const BallPosition = ({ possession, homeTeam, awayTeam }: {
  possession: 'home' | 'away'
  homeTeam: { teamName: string } | null
  awayTeam: { teamName: string } | null
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
      <h3 className="text-lg font-bold text-white mb-3 text-center">🏀 Ball Position</h3>
      
      <div className="relative bg-green-800 rounded-lg p-4 min-h-[120px] border-2 border-white">
        <div className="text-center">
          <div className="text-gray-300 text-sm mb-2">Court Center</div>
          
          {/* Ball indicator - always in center */}
          <div className="flex justify-center">
            <div className="w-6 h-6 bg-orange-500 rounded-full animate-bounce flex items-center justify-center text-xs">
              🏀
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <div className="text-yellow-400 font-bold text-sm">
              Possession: {possession === 'home' ? homeTeam?.teamName : awayTeam?.teamName}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Component
const GamePlayEnhanced = () => {
  const {
    gameState,
    homeTeam,
    awayTeam,
    gameEvents,
    isSimulating,
    showCoachPopup,
    loading,
    error,
    startGame,
    pauseGame,
    handleCoachStrategy,
    skipCoachPopup,
    formatTime
  } = useGameEngineEnhanced()

  const [activeTab, setActiveTab] = useState<'commentary' | 'events' | 'stats'>('commentary')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <div className="text-white text-xl">Loading game...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ Error loading game</div>
          <div className="text-white">{error}</div>
          <Link href="/gamePage/mainMenu" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg">
            Back to Menu
          </Link>
        </div>
      </div>
    )
  }

  if (!homeTeam || !awayTeam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-xl mb-4">Teams not loaded</div>
          <Link href="/gamePage/mainMenu" className="bg-blue-600 text-white px-6 py-2 rounded-lg">
            Back to Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="absolute top-8 left-8 z-20">
          <Link href="/gamePage/mainMenu">
            <motion.div
              className="bg-white/10 backdrop-blur-lg hover:bg-white/20 p-3 rounded-xl border border-white/20 shadow-xl transition-all group cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
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
        
        <h1 className="text-3xl font-bold text-white text-center">
          🏀 {homeTeam.teamName} vs {awayTeam.teamName}
        </h1>
        
        <div className="w-32"></div> 
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Game Area */}
        <div className="flex-1">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">

            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setActiveTab('commentary')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'commentary' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🎙️ Live Commentary
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'events' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                📻 Live Events
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'stats' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                📊 Player Stats
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'commentary' && (
              <GameCommentary gameState={gameState} gameEvents={gameEvents} />
            )}
            {activeTab === 'events' && (
              <LiveEvents gameEvents={gameEvents} />
            )}
            {activeTab === 'stats' && (
              <PlayerStats homeTeam={homeTeam} awayTeam={awayTeam} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Scoreboard */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <h2 className="text-lg font-bold text-white mb-4 text-center">📊 Scoreboard</h2>
            
            {/* Time and Quarter */}
            <div className="flex justify-center space-x-6 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {formatTime(gameState.timeLeft)}
                </div>
                <div className="text-gray-400 text-sm">TIME</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">
                  Q{gameState.quarter}
                </div>
                <div className="text-gray-400 text-sm">QUARTER</div>
              </div>
            </div>

            {/* Scores */}
            <div className="flex justify-center space-x-8 mb-4">
              <div className="text-center">
                <div className="text-gray-300 text-sm mb-1">{homeTeam.teamName}</div>
                <div className="flex items-center justify-center space-x-2">
                  {gameState.possession === 'home' && (
                    <div className="text-orange-400 text-xl">🏀</div>
                  )}
                  <div className="text-4xl font-bold text-purple-400">{gameState.homeScore}</div>
                </div>
              </div>
              
              <div className="text-gray-400 text-xl self-center">VS</div>
              
              <div className="text-center">
                <div className="text-gray-300 text-sm mb-1">{awayTeam.teamName}</div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="text-4xl font-bold text-blue-400">{gameState.awayScore}</div>
                  {gameState.possession === 'away' && (
                    <div className="text-orange-400 text-xl">🏀</div>
                  )}
                </div>
              </div>
            </div>

            {/* Game Controls */}
            <div className="flex justify-center space-x-2">
              {/* Quarter transition indicator */}
              {gameState.quarter > 1 && !gameState.isPlaying && !gameState.gameEnded && !showCoachPopup && (
                <div className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-bold">
                  Q{gameState.quarter} Ready - Press START
                </div>
              )}
              
              <button
                onClick={() => gameState.isPlaying ? pauseGame() : startGame()}
                disabled={gameState.gameEnded}
                className={`px-6 py-3 rounded-lg font-bold text-white transition-all duration-200 ${
                  gameState.gameEnded 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : gameState.isPlaying 
                      ? 'bg-red-600 hover:bg-red-700 hover:scale-105' 
                      : 'bg-green-600 hover:bg-green-700 hover:scale-105'
                } shadow-lg`}
              >
                {gameState.gameEnded ? '⏹️ ENDED' : gameState.isPlaying ? '⏸️ PAUSE' : '▶️ START'}
              </button>
            </div>

            {/* Game Over Message */}
            {gameState.gameEnded && (
              <div className="mt-4 text-center p-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg border">
                <h3 className="text-xl font-bold text-white mb-2">🏆 GAME OVER! 🏆</h3>
                {(() => {
                  const imagineScore = homeTeam.teamName === 'Imagine' ? gameState.homeScore : gameState.awayScore
                  const opponentScore = homeTeam.teamName === 'Imagine' ? gameState.awayScore : gameState.homeScore
                  
                  if (imagineScore > opponentScore) {
                    return (
                      <div className="text-green-400 font-bold">
                        🎉 Victory! Well coached!
                      </div>
                    )
                  } else if (opponentScore > imagineScore) {
                    return (
                      <div className="text-red-400 font-bold">
                        😞 Defeat. Better luck next time!
                      </div>
                    )
                  } else {
                    return (
                      <div className="text-yellow-400 font-bold">
                        🤝 It&apos;s a tie! What a game!
                      </div>
                    )
                  }
                })()}
              </div>
            )}
          </div>

          {/* Ball Position Indicator */}
          <BallPosition 
            possession={gameState.possession}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
        </div>
      </div>

      {/* Status Indicator */}
      {isSimulating && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-full text-sm flex items-center space-x-2 shadow-lg">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <span>🔄 Simulation Running</span>
        </div>
      )}      {/* Coach Popup */}
      {showCoachPopup && (
        <CoachPopup
          isOpen={showCoachPopup}
          onSelectStrategy={handleCoachStrategy}
          onClose={skipCoachPopup}
        />
      )}

      {/* Game Music Player */}
      <GameMusicPlayer />
    </div>
  )
}

export default GamePlayEnhanced
