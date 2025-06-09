'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

interface ScheduleGame {
  scheduleId: number
  week: number
  homeTeamId: number
  awayTeamId: number
  gameDate: string
  isCompleted: boolean
  isUserGame: boolean
  homeScore?: number
  awayScore?: number
  winnerTeamId?: number
  seasonType: string
}

interface Team {
  teamId: number
  teamName: string
  wins: number
  lose: number
}

interface ScheduleData {
  [week: number]: ScheduleGame[]
}

const TEAM_DISPLAY_DATA: Record<string, { color: string; logo: string }> = {
  'Riverlake Eagles': {
    color: "from-yellow-500 to-orange-600",
    logo: "🦅"
  },
  'Imagine': {
    color: "from-purple-500 to-indigo-600", 
    logo: "💫"
  },
  'Storm Breakers': {
    color: "from-blue-500 to-cyan-600",
    logo: "⚡"
  },
  'Red Dragons': {
    color: "from-red-500 to-rose-600",
    logo: "🐉"
  },
  'Wolverines': {
    color: "from-gray-500 to-slate-600",
    logo: "🐺"
  },
  'Golden Tigers': {
    color: "from-orange-500 to-yellow-600",
    logo: "🐅"
  }
}

const LeagueCalendar = () => {
  const [schedule, setSchedule] = useState<ScheduleData>({})
  const [teams, setTeams] = useState<Record<number, Team>>({})
  const [currentWeek, setCurrentWeek] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nextGame, setNextGame] = useState<any>(null)
  const [simulating, setSimulating] = useState(false)

  useEffect(() => {
    fetchScheduleData()
    fetchNextGame()
  }, [])

  const fetchScheduleData = async () => {
    try {
      setLoading(true)
      
      const storedUser = localStorage.getItem('user')
      if (!storedUser) {
        setError('Please login first')
        return
      }
      
      const user = JSON.parse(storedUser)
      
      const response = await fetch(`http://localhost:8080/api/schedule/league/${user.id}`)
      const data = await response.json()
      
      if (data.success) {
        setSchedule(data.schedule)
        setTeams(data.teams)
        setCurrentWeek(data.currentWeek)
      } else {
        // Try to generate schedule if not exists
        await generateSchedule()
      }
    } catch (err) {
      console.error('Error fetching schedule:', err)
      setError('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  const fetchNextGame = async () => {
    try {
      const storedUser = localStorage.getItem('user')
      if (!storedUser) return
      
      const user = JSON.parse(storedUser)
      
      const response = await fetch(`http://localhost:8080/api/schedule/next-game/${user.id}`)
      const data = await response.json()
      
      if (data.success && data.nextGame) {
        setNextGame(data)
      }
    } catch (err) {
      console.error('Error fetching next game:', err)
    }
  }

  const generateSchedule = async () => {
    try {
      const storedUser = localStorage.getItem('user')
      if (!storedUser) return
      
      const user = JSON.parse(storedUser)
      
      const response = await fetch(`http://localhost:8080/api/schedule/generate/${user.id}`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchScheduleData()
      } else {
        setError(data.message)
      }
    } catch (err) {
      console.error('Error generating schedule:', err)
      setError('Failed to generate schedule')
    }
  }

  const simulateWeek = async () => {
    try {
      setSimulating(true)
      
      const storedUser = localStorage.getItem('user')
      if (!storedUser) return
      
      const user = JSON.parse(storedUser)
      
      const response = await fetch(`http://localhost:8080/api/schedule/simulate-week/${user.id}`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchScheduleData()
        await fetchNextGame()
      }
    } catch (err) {
      console.error('Error simulating week:', err)
    } finally {
      setSimulating(false)
    }
  }

  const getTeamDisplay = (teamId: number) => {
    const team = teams[teamId]
    if (!team) return { name: 'Unknown', logo: '🏀', color: 'from-gray-500 to-slate-600' }
    
    const displayData = TEAM_DISPLAY_DATA[team.teamName] || { logo: '🏀', color: 'from-gray-500 to-slate-600' }
    return {
      name: team.teamName,
      logo: displayData.logo,
      color: displayData.color,
      record: `${team.wins}-${team.lose}`
    }
  }

  const getWeekStatus = (weekNumber: number) => {
    const weekGames = schedule[weekNumber] || []
    const completedGames = weekGames.filter(game => game.isCompleted).length
    const totalGames = weekGames.length
    
    if (totalGames === 0) return 'Not Scheduled'
    if (completedGames === 0) return 'Not Started'
    if (completedGames === totalGames) return 'Completed'
    return `${completedGames}/${totalGames} Complete`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading league calendar...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button 
            onClick={generateSchedule}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Generate Schedule
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto mb-6">
        <Link 
          href="/gamePage/mainMenu" 
          className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-xl px-4 py-2 border border-white/20 hover:bg-white/20 transition-all duration-300 group"
        >
          <motion.div
            whileHover={{ x: -2 }}
            transition={{ duration: 0.5 }}
          >
            <Image 
              src="/runner.svg" 
              alt="Back to Menu" 
              width={24} 
              height={24} 
              className="w-6 h-6 text-white group-hover:scale-110 transition-transform" 
            />
          </motion.div>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            📅 LEAGUE CALENDAR
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-gray-300 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            5-Week Basketball League Schedule & Results
          </motion.p>
        </div>

        {/* Next Game Card */}
        {nextGame && (
          <motion.div 
            className="mb-8 p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-white mb-4 text-center">🎯 Your Next Game</h2>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="text-4xl mb-2">{getTeamDisplay(nextGame.homeTeam.teamId).logo}</div>
                <div className="text-white font-bold">{getTeamDisplay(nextGame.homeTeam.teamId).name}</div>
                <div className="text-white/80 text-sm">{getTeamDisplay(nextGame.homeTeam.teamId).record}</div>
              </div>
              <div className="text-center">
                <div className="text-white text-2xl font-bold">VS</div>
                <div className="text-white/80">Week {nextGame.week}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">{getTeamDisplay(nextGame.awayTeam.teamId).logo}</div>
                <div className="text-white font-bold">{getTeamDisplay(nextGame.awayTeam.teamId).name}</div>
                <div className="text-white/80 text-sm">{getTeamDisplay(nextGame.awayTeam.teamId).record}</div>
              </div>
            </div>
            <div className="text-center mt-4">
              <Link 
                href="/gamePage/gamePlay"
                className="bg-white text-green-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-bold transition-all duration-300 hover:scale-105"
              >
                🏀 Play Game
              </Link>
            </div>
          </motion.div>
        )}

        {/* Week Navigation & Actions */}
        <motion.div 
          className="flex flex-wrap justify-between items-center mb-6 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="flex space-x-2 mb-2 md:mb-0">
            {[1, 2, 3, 4, 5, 6].map((week) => (
              <button
                key={week}
                onClick={() => setCurrentWeek(week)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  currentWeek === week
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {week <= 5 ? `Week ${week}` : 'Finals'}
              </button>
            ))}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={simulateWeek}
              disabled={simulating}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
            >
              {simulating ? '⏳ Simulating...' : '🤖 Simulate Week'}
            </button>
            <button
              onClick={fetchScheduleData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
            >
              🔄 Refresh
            </button>
          </div>
        </motion.div>

        {/* Schedule Display */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {[1, 2, 3, 4, 5, 6].map((week) => {
            const weekGames = schedule[week] || []
            const weekStatus = getWeekStatus(week)
            const isPlayoffWeek = week === 6
            
            return (
              <motion.div
                key={week}
                className={`p-6 rounded-2xl shadow-xl border-2 transition-all duration-300 ${
                  currentWeek === week
                    ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-400'
                    : 'bg-white/10 backdrop-blur-lg border-white/20'
                } ${isPlayoffWeek ? 'bg-gradient-to-br from-yellow-600/20 to-red-600/20' : ''}`}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {isPlayoffWeek ? '🏆 FINALS' : `📅 Week ${week}`}
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    weekStatus === 'Completed' ? 'bg-green-600 text-white' :
                    weekStatus === 'Not Started' ? 'bg-gray-600 text-white' :
                    weekStatus.includes('Complete') ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {weekStatus}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {weekGames.length === 0 ? (
                    <div className="text-center text-gray-400 py-4">
                      {isPlayoffWeek ? 'Finals not yet scheduled' : 'No games scheduled'}
                    </div>
                  ) : (
                    weekGames.map((game, index) => {
                      const homeTeam = getTeamDisplay(game.homeTeamId)
                      const awayTeam = getTeamDisplay(game.awayTeamId)
                      
                      return (
                        <div
                          key={game.scheduleId}
                          className={`p-3 rounded-lg border ${
                            game.isUserGame
                              ? 'bg-purple-600/20 border-purple-400'
                              : 'bg-white/5 border-white/20'
                          } ${game.isCompleted ? 'opacity-80' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{homeTeam.logo}</span>
                              <span className="text-white font-medium text-sm">{homeTeam.name}</span>
                              {game.isCompleted && (
                                <span className="text-white font-bold">{game.homeScore}</span>
                              )}
                            </div>
                            <span className="text-white/60 text-xs">VS</span>
                            <div className="flex items-center space-x-2">
                              {game.isCompleted && (
                                <span className="text-white font-bold">{game.awayScore}</span>
                              )}
                              <span className="text-white font-medium text-sm">{awayTeam.name}</span>
                              <span className="text-lg">{awayTeam.logo}</span>
                            </div>
                          </div>
                          
                          {game.isUserGame && (
                            <div className="text-center mt-2">
                              <span className="text-purple-300 text-xs font-semibold">🎮 YOUR GAME</span>
                            </div>
                          )}
                          
                          {game.isCompleted && (
                            <div className="text-center mt-2">
                              <span className={`text-xs font-semibold ${
                                game.winnerTeamId === game.homeTeamId ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {game.winnerTeamId === game.homeTeamId ? homeTeam.name : awayTeam.name} Won
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
                
                {isPlayoffWeek && weekGames.length === 0 && (
                  <div className="text-center mt-4">
                    <button 
                      onClick={async () => {
                        try {
                          const storedUser = localStorage.getItem('user')
                          if (!storedUser) return
                          
                          const user = JSON.parse(storedUser)
                          const response = await fetch(`http://localhost:8080/api/schedule/generate-playoffs/${user.id}`, {
                            method: 'POST'
                          })
                          const data = await response.json()
                          
                          if (data.success) {
                            await fetchScheduleData()
                          }
                        } catch (err) {
                          console.error('Error generating playoffs:', err)
                        }
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                      🏆 Generate Finals
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>

        {/* Legend */}
        <motion.div 
          className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <h3 className="text-xl font-bold text-white mb-4">📝 Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-gray-300">
              <span className="font-semibold text-purple-300">🎮:</span> Your Games
            </div>
            <div className="text-gray-300">
              <span className="font-semibold text-blue-300">🤖:</span> Bot vs Bot
            </div>
            <div className="text-gray-300">
              <span className="font-semibold text-green-300">✅:</span> Completed
            </div>
            <div className="text-gray-300">
              <span className="font-semibold text-yellow-300">🏆:</span> Finals
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LeagueCalendar
