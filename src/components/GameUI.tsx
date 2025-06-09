'use client'

import React from 'react'
import Link from 'next/link'
import CoachPopup from '@/components/CoachPopup'
import { useGameEngine } from '@/components/GameEngine'

const GamePlay = () => {
  const {
    gameState,
    gameEvents,
    isSimulating,
    showCoachPopup,
    homeTeam,
    awayTeam,
    loading,
    error,
    formatTime,
    startGame,
    pauseGame,
    handleCoachStrategy,
    skipCoachPopup
  } = useGameEngine()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-red-400 text-xl mb-4">Error loading game</div>
          <div className="text-gray-300 mb-6">{error}</div>
          <Link href="/gamePage/mainMenu" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold transition-colors">
            Return to Main Menu
          </Link>
        </div>
      </div>
    )
  }

  if (!homeTeam || !awayTeam) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">No teams found...</div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-slate-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/gamePage/mainMenu"
          className="text-white hover:text-blue-400 transition-colors"
        >
          ← Main Menu
        </Link>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">
            🏀 {homeTeam.teamName} vs {awayTeam.teamName}
          </h1>
        </div>
        
        <div className="w-20"></div> {/* Spacer for balance */}
      </div>

      {/* Main Game Layout */}
      <div className="flex flex-col lg:flex-row gap-6">        {/* Simple Game Display */}
        <div className="flex-1">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-4">🏀 Game in Progress</h3>
              
              {/* Simple Court Representation */}
              <div className="w-full h-32 bg-green-700 rounded-lg border-2 border-orange-400 relative">
                {/* Court center line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white transform -translate-x-1/2"></div>
                
                {/* Team sides */}
                <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                  {homeTeam.teamName}
                </div>
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  {awayTeam.teamName}
                </div>
                
                {/* Possession indicator */}
                {gameState.possession && (
                  <div className={`absolute bottom-2 ${
                    gameState.possession === 'home' ? 'left-2' : 'right-2'
                  } bg-orange-600 text-white px-2 py-1 rounded text-xs`}>
                    🏀 BALL
                  </div>
                )}
              </div>
                {/* Game Status */}
              <div className="mt-4">
                {gameState.gameEnded ? (
                  <div className="text-green-400 font-bold">🏁 GAME FINISHED!</div>
                ) : gameState.isPlaying ? (
                  <div className="text-yellow-400 font-bold">▶️ PLAYING</div>
                ) : (
                  <div className="text-gray-400">⏸️ PAUSED</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Scoreboard */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-bold text-white mb-4 text-center">Scoreboard</h2>
            
            {/* Time and Quarter */}
            <div className="flex justify-center space-x-6 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {formatTime(gameState.timeLeft)}
                </div>
                <div className="text-gray-400 text-sm">TIME</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
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
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  )}
                  <div className="text-3xl font-bold text-purple-400">{gameState.homeScore}</div>
                </div>
              </div>
              
              <div className="text-gray-400 text-xl self-center">VS</div>
              
              <div className="text-center">
                <div className="text-gray-300 text-sm mb-1">{awayTeam.teamName}</div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="text-3xl font-bold text-blue-400">{gameState.awayScore}</div>
                  {gameState.possession === 'away' && (
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
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
                className={`px-4 py-2 rounded font-bold text-white ${
                  gameState.gameEnded 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : gameState.isPlaying 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                } transition-colors`}
              >
                {gameState.gameEnded ? 'ENDED' : gameState.isPlaying ? 'PAUSE' : 'START'}
              </button>
            </div>
              {/* Game Over Message */}
            {gameState.gameEnded && (
              <div className="mt-4 text-center p-4 bg-gray-700 rounded">
                <h3 className="text-xl font-bold text-white mb-2">🏀 GAME OVER! 🏀</h3>
                {(() => {
                  const imagineScore = homeTeam.teamName === 'Imagine' ? gameState.homeScore : gameState.awayScore
                  const opponentScore = homeTeam.teamName === 'Imagine' ? gameState.awayScore : gameState.homeScore
                  
                  if (imagineScore > opponentScore) {
                    return (
                      <div>
                        <p className="text-green-400 font-bold">🎉 IMAGINE WINS! 🎉</p>
                        <p className="text-white">Final Score: {imagineScore} - {opponentScore}</p>
                      </div>
                    )
                  } else if (opponentScore > imagineScore) {
                    return (
                      <div>
                        <p className="text-red-400 font-bold">😔 IMAGINE LOSES 😔</p>
                        <p className="text-white">Final Score: {imagineScore} - {opponentScore}</p>
                      </div>
                    )
                  } else {
                    return (
                      <div>
                        <p className="text-yellow-400 font-bold">🤝 IT&apos;S A TIE! 🤝</p>
                        <p className="text-white">Final Score: {imagineScore} - {opponentScore}</p>
                      </div>
                    )
                  }
                })()}
              </div>
            )}
          </div>

          {/* Game Events */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3 text-center">Live Events</h3>
            
            <div className="h-64 overflow-y-auto space-y-2">
              {gameEvents.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <p>Events will appear here</p>
                  <p className="text-sm">Start the game!</p>
                </div>
              ) : (
                gameEvents.slice(0, 20).map((event) => (
                  <div
                    key={event.id}
                    className={`p-2 rounded border-l-4 text-sm ${
                      event.team === 'home' 
                        ? 'bg-purple-900/30 border-purple-400' 
                        : event.team === 'away'
                        ? 'bg-blue-900/30 border-blue-400'
                        : 'bg-gray-900/30 border-gray-400'
                    }`}
                  >
                    <div className="text-white">
                      {event.team !== 'neutral' && (
                        <span className={`font-bold ${
                          event.team === 'home' ? 'text-purple-400' : 'text-blue-400'
                        }`}>
                          {event.team === 'home' ? homeTeam.teamName : awayTeam.teamName}:{' '}
                        </span>
                      )}
                      {event.event}
                      {event.points && event.points > 0 && (
                        <span className="text-orange-400 font-bold"> (+{event.points})</span>
                      )}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      Q{event.quarter} - {event.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      {isSimulating && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-full text-sm">
          🔄 Simulation Running
        </div>
      )}

      {/* Coach Popup */}
      {showCoachPopup && (
        <CoachPopup
          isOpen={showCoachPopup}
          onSelectStrategy={handleCoachStrategy}
          onClose={skipCoachPopup}
        />
      )}
    </div>
  )
}

export default GamePlay
