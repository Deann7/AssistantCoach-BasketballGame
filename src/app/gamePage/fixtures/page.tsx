'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { scheduleAPI, teamsAPI } from '@/lib/api'

// Types for schedule data
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
  isUserTeam?: boolean
}

interface WeeklySchedule {
  [week: number]: ScheduleGame[]
}

// Team display data
const TEAM_DISPLAY_DATA: Record<string, { color: string; logo: string }> = {
  'Riverlake Eagles': { color: "from-yellow-500 to-orange-600", logo: "🦅" },
  'Imagine': { color: "from-purple-500 to-indigo-600", logo: "💫" },
  'Storm Breakers': { color: "from-blue-500 to-cyan-600", logo: "⚡" },
  'Red Dragons': { color: "from-red-500 to-rose-600", logo: "🐉" },
  'Wolverines': { color: "from-gray-500 to-slate-600", logo: "🐺" },
  'Golden Tigers': { color: "from-orange-500 to-yellow-600", logo: "🐅" }
}

const Fixtures = () => {
  const [schedule, setSchedule] = useState<WeeklySchedule>({})
  const [teams, setTeams] = useState<Record<number, Team>>({})
  const [currentWeek, setCurrentWeek] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedWeek, setSelectedWeek] = useState<number>(1)
  const [simulatingWeek, setSimulatingWeek] = useState<number | null>(null)
  const [showCreateSchedule, setShowCreateSchedule] = useState(false)
  const [creating, setCreating] = useState(false)
  const [cleaningUp, setCleaningUp] = useState(false)
  const router = useRouter()
  useEffect(() => {
    loadScheduleData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadScheduleData = async () => {
    try {
      setLoading(true)
      setError('')

      // Get user data
      const userDataString = localStorage.getItem('user')
      console.log(userDataString)
      if (!userDataString) {
        setError('Please login first')
        router.push('/pages/login')
        return
      }

      const userData = JSON.parse(userDataString)
      console.log(userData.id)
        // Try to get existing schedule
      const scheduleResponse = await scheduleAPI.getLeagueSchedule(userData.id)
      
      if (scheduleResponse.success) {
        // Check if schedule exists and has games
        if (scheduleResponse.schedule && Object.keys(scheduleResponse.schedule).length > 0) {
          setSchedule(scheduleResponse.schedule)
          setTeams(scheduleResponse.teams)
          setCurrentWeek(scheduleResponse.currentWeek || 1)
          setSelectedWeek(scheduleResponse.currentWeek || 1)
        } else {
          // Schedule exists but is empty, try to generate it
          console.log('Schedule exists but is empty, generating...')
          const generateResponse = await scheduleAPI.generateSchedule(userData.id)
          if (generateResponse.success) {
            // Reload schedule data after generation
            const newScheduleResponse = await scheduleAPI.getLeagueSchedule(userData.id)
            if (newScheduleResponse.success && newScheduleResponse.schedule) {
              setSchedule(newScheduleResponse.schedule)
              setTeams(newScheduleResponse.teams)
              setCurrentWeek(newScheduleResponse.currentWeek || 1)
              setSelectedWeek(newScheduleResponse.currentWeek || 1)
            } else {
              setShowCreateSchedule(true)
            }
          } else {
            setShowCreateSchedule(true)
          }
        }
      } else {
        // No schedule exists, show option to create
        setShowCreateSchedule(true)
      }

    } catch (error) {
      console.error('Error loading schedule:', error)
      setError('Failed to load schedule data')
      setShowCreateSchedule(true)
    } finally {
      setLoading(false)
    }
  }

  const createSchedule = async () => {
    try {
      setCreating(true)
      setError('')

      const userDataString = localStorage.getItem('user')
      if (!userDataString) return

      const userData = JSON.parse(userDataString)

      // 1. Try to setup league/teams first
      const setupResponse = await teamsAPI.setupUserLeague(userData.id)
      

      if (!setupResponse.success && setupResponse.message?.includes('already has an active league')) {
        // 2. If league exists, reset it
        const resetResponse = await scheduleAPI.resetSchedule(userData.id)
        if (!resetResponse.success) {
          setError(resetResponse.message || 'Failed to reset league')
          return
        }
      } else if (!setupResponse.success) {
        setError(setupResponse.message || 'Failed to setup league')
        return
      }      // 3. Now try to generate the schedule
      const response = await scheduleAPI.generateSchedule(userData.id)

      if (response.success) {
        setShowCreateSchedule(false)
        await loadScheduleData() // Reload data
      } else {
        setError(response.message || 'Failed to create schedule')
      }

    } catch (error: unknown) {
      console.error('Error creating schedule:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create schedule'
      setError(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  const cleanupUserData = async () => {
    try {
      setCleaningUp(true)
      setError('')

      const userDataString = localStorage.getItem('user')
      if (!userDataString) return

      const userData = JSON.parse(userDataString)
      
      const response = await teamsAPI.cleanupUserData(userData.id)
      
      if (response.success) {
        // Show success message
        setError(`Cleanup successful! Removed: ${response.deletedLeagues} leagues, ${response.deletedTeams} teams, ${response.deletedPlayers} players, ${response.deletedSchedules} schedules`)
        
        // Reset the page state
        setSchedule({})
        setTeams({})
        setCurrentWeek(1)
        setSelectedWeek(1)
        setShowCreateSchedule(true)
      } else {
        setError(response.message || 'Failed to cleanup user data')
      }

    } catch (error) {
      console.error('Error cleaning up user data:', error)
      setError('Failed to cleanup user data')
    } finally {
      setCleaningUp(false)
    }
  }

  const simulateWeek = async (week: number) => {
    try {
      setSimulatingWeek(week)

      const userDataString = localStorage.getItem('user')
      if (!userDataString) return

      const userData = JSON.parse(userDataString)
      
      const response = await scheduleAPI.simulateWeek(userData.id)
      
      if (response.success) {
        await loadScheduleData() // Reload to see results
      } else {
        setError(response.message || 'Failed to simulate week')
      }

    } catch (error) {
      console.error('Error simulating week:', error)
      setError('Failed to simulate week')
    } finally {
      setSimulatingWeek(null)
    }
  }

  const generatePlayoffs = async () => {
    try {
      const userDataString = localStorage.getItem('user')
      if (!userDataString) return

      const userData = JSON.parse(userDataString)
      
      const response = await scheduleAPI.generatePlayoffs(userData.id)
      
      if (response.success) {
        await loadScheduleData() // Reload to see playoffs
      } else {
        setError(response.message || 'Failed to generate playoffs')
      }    } catch (error) {
      console.error('Error generating playoffs:', error)
      setError('Failed to generate playoffs')
    }
  }

  const getTeamDisplay = (teamId: number) => {
    // Try different ways to find the team since the key could be number or string
    let team: Team | undefined = teams[teamId];
    if (!team) {
      // Convert teamId to string to check string keys
      const teamIdAsString = String(teamId);
      team = teams[teamIdAsString as unknown as number];
    }
    if (!team) team = Object.values(teams).find((t: Team) => t.teamId === teamId);
    if (!team) return { name: 'Unknown', logo: '🏀', color: 'from-gray-500 to-slate-600', isUser: false };
    
    const display = TEAM_DISPLAY_DATA[team.teamName] || { logo: '🏀', color: 'from-gray-500 to-slate-600' };
    return {
      name: team.teamName,
      logo: display.logo,
      color: display.color,
      isUser: team.isUserTeam
    };
  }

  const formatGameDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    })
  }

  const isRegularSeasonComplete = () => {
    const regularWeeks = [1, 2, 3, 4, 5]
    return regularWeeks.every(week => {
      const weekGames = schedule[week] || []
      return weekGames.every(game => game.isCompleted)
    })
  }
  const hasPlayoffs = () => {
    return schedule[6] && schedule[6].length > 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading fixtures...</div>
      </div>
    )
  }

  if (showCreateSchedule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >            <h1 className="text-3xl font-bold text-white mb-6">🏀 Create League Schedule</h1>
            <p className="text-gray-300 mb-8">
              Generate a comprehensive 5-week tournament schedule where each team plays every other team once, 
              followed by playoffs between the top 2 teams.
              <br /><br />
              If you have previous league data that needs to be cleaned up, use the &ldquo;Reset Data&rdquo; button to remove old leagues, teams, and schedules.
            </p>
            
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 mb-6">
                <p className="text-red-400">{error}</p>
              </div>
            )}            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={createSchedule}
                disabled={creating || cleaningUp}
                className={`px-8 py-3 rounded-lg font-bold text-white ${
                  creating || cleaningUp
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } transition-colors`}
              >
                {creating ? '🔄 Creating...' : '🏀 Create Schedule'}
              </button>

              <button
                onClick={cleanupUserData}
                disabled={creating || cleaningUp}
                className={`px-8 py-3 rounded-lg font-bold text-white ${
                  creating || cleaningUp
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'
                } transition-colors`}
              >
                {cleaningUp ? '🧹 Cleaning...' : '🧹 Reset Data'}
              </button>
              
              <Link href="/gamePage/mainMenu">
                <button className="px-8 py-3 rounded-lg font-bold text-white bg-gray-600 hover:bg-gray-700 transition-colors">
                  ← Back to Menu
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      {/* Navigation */}
      <div className="absolute top-8 left-8 z-20">
        <Link href="/gamePage/mainMenu">
          <motion.div
            className="bg-white/10 backdrop-blur-lg hover:bg-white/20 p-3 rounded-xl border border-white/20 shadow-xl transition-all group cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
            📅 LEAGUE FIXTURES
          </h1>
          <p className="text-xl text-gray-300">
            5-Week Tournament Schedule & Playoff System
          </p>
        </motion.div>        {error && (
          <motion.div 
            className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 mb-6 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-red-400 text-center">{error}</p>
          </motion.div>
        )}

        {/* Admin Controls */}
        <motion.div 
          className="flex justify-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex gap-3 items-center">
              <span className="text-white font-semibold">⚙️ Controls:</span>
              <button
                onClick={cleanupUserData}
                disabled={cleaningUp}
                className={`px-4 py-2 rounded-lg font-semibold text-white ${
                  cleaningUp
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'
                } transition-colors`}
              >
                {cleaningUp ? '🧹 Resetting...' : '🧹 Reset League'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Week Navigation */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-2 border border-white/20">
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((week) => (
                <button
                  key={week}
                  onClick={() => setSelectedWeek(week)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedWeek === week
                      ? 'bg-orange-500 text-white'
                      : week === currentWeek
                        ? 'bg-blue-500/50 text-white border border-blue-400'
                        : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  Week {week}
                  {week === currentWeek && (
                    <span className="ml-1 text-xs">⚡</span>
                  )}
                </button>
              ))}
              
              {hasPlayoffs() && (
                <button
                  onClick={() => setSelectedWeek(6)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedWeek === 6
                      ? 'bg-yellow-500 text-black'
                      : 'text-yellow-400 hover:bg-yellow-500/20 border border-yellow-400/50'
                  }`}
                >
                  🏆 Finals
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Schedule Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedWeek}
            className="grid gap-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {selectedWeek === 6 ? (
              // Playoff Display
              <div className="max-w-2xl mx-auto">
                <motion.div 
                  className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 border border-yellow-400/30"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <h2 className="text-2xl font-bold text-yellow-400 text-center mb-6">
                    🏆 CHAMPIONSHIP FINALS 🏆
                  </h2>
                  
                  {schedule[6] && schedule[6].length > 0 ? (
                    <div className="space-y-4">
                      {schedule[6].map((game) => (
                        <div key={game.scheduleId} className="bg-black/30 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-center flex-1">
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-2xl">{getTeamDisplay(game.homeTeamId).logo}</span>
                                <span className={`font-bold text-lg ${
                                  getTeamDisplay(game.homeTeamId).isUser ? 'text-purple-400' : 'text-white'
                                }`}>
                                  {getTeamDisplay(game.homeTeamId).name}
                                </span>
                              </div>
                              {game.isCompleted && (
                                <div className="text-2xl font-bold text-orange-400 mt-2">
                                  {game.homeScore}
                                </div>
                              )}
                            </div>
                            
                            <div className="text-center text-white font-bold">
                              {game.isCompleted ? 'FINAL' : 'VS'}
                            </div>
                            
                            <div className="text-center flex-1">
                              <div className="flex items-center justify-center space-x-2">
                                <span className={`font-bold text-lg ${
                                  getTeamDisplay(game.awayTeamId).isUser ? 'text-purple-400' : 'text-white'
                                }`}>
                                  {getTeamDisplay(game.awayTeamId).name}
                                </span>
                                <span className="text-2xl">{getTeamDisplay(game.awayTeamId).logo}</span>
                              </div>
                              {game.isCompleted && (
                                <div className="text-2xl font-bold text-orange-400 mt-2">
                                  {game.awayScore}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-center mt-4">
                            {game.isCompleted ? (
                              <div className="text-yellow-400 font-bold">
                                🏆 {getTeamDisplay(game.winnerTeamId!).name} WINS THE CHAMPIONSHIP! 🏆
                              </div>
                            ) : (
                              <div className="text-gray-400">
                                📅 {formatGameDate(game.gameDate)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-300 mb-4">
                        Regular season must be completed before playoffs can be generated.
                      </p>
                      {isRegularSeasonComplete() && (
                        <button
                          onClick={generatePlayoffs}
                          className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-black font-bold rounded-lg transition-colors"
                        >
                          🏆 Generate Finals
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            ) : (
              // Regular Season Display
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Week {selectedWeek} Schedule
                  </h2>
                  
                  {selectedWeek === currentWeek && schedule[selectedWeek] && 
                   schedule[selectedWeek].some(game => !game.isCompleted && !game.isUserGame) && (
                    <button
                      onClick={() => simulateWeek(selectedWeek)}
                      disabled={simulatingWeek === selectedWeek}
                      className={`px-4 py-2 rounded-lg font-semibold ${
                        simulatingWeek === selectedWeek
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white transition-colors`}
                    >
                      {simulatingWeek === selectedWeek ? '🔄 Simulating...' : '🤖 Simulate AI Games'}
                    </button>
                  )}
                </div>

                <div className="grid gap-4">
                  {schedule[selectedWeek] && schedule[selectedWeek].length > 0 ? (
                    schedule[selectedWeek].map((game) => (
                      <motion.div
                        key={game.scheduleId}
                        className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border ${
                          game.isUserGame 
                            ? 'border-purple-400/50 bg-purple-500/10' 
                            : 'border-white/20'
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-center flex-1">
                            <div className="flex items-center justify-center space-x-3">
                              <span className="text-3xl">{getTeamDisplay(game.homeTeamId).logo}</span>
                              <div>
                                <div className={`font-bold text-lg ${
                                  getTeamDisplay(game.homeTeamId).isUser ? 'text-purple-400' : 'text-white'
                                }`}>
                                  {getTeamDisplay(game.homeTeamId).name}
                                </div>
                                <div className="text-sm text-gray-400">HOME</div>
                              </div>
                            </div>
                            {game.isCompleted && (
                              <div className="text-3xl font-bold text-orange-400 mt-2">
                                {game.homeScore}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-center mx-8">
                            <div className="text-white font-bold text-lg">
                              {game.isCompleted ? 'FINAL' : 'VS'}
                            </div>
                            <div className="text-gray-400 text-sm mt-1">
                              📅 {formatGameDate(game.gameDate)}
                            </div>
                            {game.isUserGame && !game.isCompleted && (
                              <button
                                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg font-bold"
                                onClick={() => {
                                  localStorage.setItem('currentScheduleId', game.scheduleId.toString());
                                  localStorage.setItem('currentWeek', game.week.toString());
                                  localStorage.setItem('homeTeamId', game.homeTeamId.toString());
                                  localStorage.setItem('awayTeamId', game.awayTeamId.toString());
                                  localStorage.setItem('homeTeamName', getTeamDisplay(game.homeTeamId).name);
                                  localStorage.setItem('awayTeamName', getTeamDisplay(game.awayTeamId).name);
                                  router.push('/gamePage/gamePlay');
                                }}
                              >
                                🎮 Play Your Game
                              </button>
                            )}
                          </div>
                          
                          <div className="text-center flex-1">
                            <div className="flex items-center justify-center space-x-3">
                              <div>
                                <div className={`font-bold text-lg ${
                                  getTeamDisplay(game.awayTeamId).isUser ? 'text-purple-400' : 'text-white'
                                }`}>
                                  {getTeamDisplay(game.awayTeamId).name}
                                </div>
                                <div className="text-sm text-gray-400">AWAY</div>
                              </div>
                              <span className="text-3xl">{getTeamDisplay(game.awayTeamId).logo}</span>
                            </div>
                            {game.isCompleted && (
                              <div className="text-3xl font-bold text-orange-400 mt-2">
                                {game.awayScore}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {game.isCompleted && (
                          <div className="text-center mt-4 pt-4 border-t border-white/10">
                            <div className="text-green-400 font-bold">
                              🏆 {getTeamDisplay(game.winnerTeamId!).name} WINS!
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <p>No games scheduled for Week {selectedWeek}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Tournament Info */}
        <motion.div 
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center">
              <span className="mr-2">📅</span>
              Tournament Format
            </h3>
            <p className="text-gray-300">
              5-week round-robin tournament where each team plays every other team once, 
              followed by championship finals between top 2 teams.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center">
              <span className="mr-2">🏀</span>
              Current Status
            </h3>
            <p className="text-gray-300">
              Currently in Week {currentWeek} of the regular season. 
              {isRegularSeasonComplete() 
                ? ' Regular season completed!' 
                : ` ${5 - currentWeek + 1} weeks remaining.`}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center">
              <span className="mr-2">🎯</span>
              Your Team
            </h3>
            <p className="text-gray-300">
              Games marked with 🎮 are your team&apos;s matches. 
              AI games are automatically simulated when you complete your games.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Fixtures