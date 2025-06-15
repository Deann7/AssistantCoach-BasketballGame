'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { teamsAPI, Team } from '@/lib/api'

interface StandingsTeam {
  teamId: number
  teamName: string
  wins: number
  lose: number
  color: string
  logo: string
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

const Standings = () => {
  const [teams, setTeams] = useState<StandingsTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true)
        
        // Get user data from localStorage
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          setError('Please login first');
          return;
        }
        
        const user = JSON.parse(storedUser);
        console.log('Fetching standings for user:', user.id);
          // Use user-specific standings API
        const response = await teamsAPI.getUserStandings(user.id)
        console.log('Standings response:', response);
        
        if (response.success) {
          // Map backend teams to frontend format
          const mappedTeams: StandingsTeam[] = response.standings.map((team: Team) => ({
            teamId: team.teamId,
            teamName: team.teamName,
            wins: team.wins,
            lose: team.lose,
            color: TEAM_DISPLAY_DATA[team.teamName]?.color || "from-gray-500 to-slate-600",
            logo: TEAM_DISPLAY_DATA[team.teamName]?.logo || "🏀"
          }))
          
          // Sort by wins (descending), then by losses (ascending)
          mappedTeams.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins
            return a.lose - b.lose
          })
          
          setTeams(mappedTeams)
        } else {
          // If no teams found, try to setup user league
          if (response.message?.includes('No teams found')) {
            console.log('Setting up user league...');
            const setupResponse = await teamsAPI.setupUserLeague(user.id);
            if (setupResponse.success) {
              setError('League setup completed! Please refresh the page.');
            } else {
              setError('Failed to setup user league: ' + setupResponse.message);
            }
          } else {
            setError(response.message || 'Failed to fetch standings');
          }
        }} catch (err: unknown) {
        console.error('Error fetching standings:', err)
        setError('Failed to connect to server')
      } finally {
        setLoading(false)
      }
    }

    fetchStandings()
  }, []) // Remove teamDisplayData dependency since it's now a constant

  const getWinPercentage = (wins: number, losses: number) => {
    const total = wins + losses
    return total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0"
  }

  const getRankDisplay = (index: number) => {
    switch (index) {
      case 0:
        return { emoji: "🥇", text: "1st" }
      case 1:
        return { emoji: "🥈", text: "2nd" }
      case 2:
        return { emoji: "🥉", text: "3rd" }
      default:
        return { emoji: "", text: `${index + 1}${index === 3 ? 'th' : 'th'}` }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading standings...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6 relative">
      {/* Navigation Button - Top Left */}
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
              alt="Back to Menu" 
              width={24} 
              height={24} 
              className="w-6 h-6 text-white group-hover:scale-110 transition-transform" 
            />
          </motion.div>
        </Link>
      </div>
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            🏀 BASKETBALL STANDINGS
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-gray-300 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Season Tournament Results - League Format
          </motion.p>
          <motion.div 
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full inline-block font-semibold shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            🏆 Live League Standings!
          </motion.div>
        </div>

        {/* Finals Qualification Banner */}
        {teams.length > 0 && (
          <motion.div 
            className="mb-8 p-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl shadow-2xl border-2 border-yellow-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                🏆 CURRENT LEADERS 🏆
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {teams.slice(0, 2).map((team, index) => (
                  <div key={team.teamId} className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                    <div className="flex items-center justify-center space-x-3">
                      <span className="text-3xl">{team.logo}</span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{team.teamName}</h3>
                        <p className="text-gray-800 font-semibold">{team.wins}-{team.lose} Record</p>
                      </div>
                      <span className="text-2xl">{index === 0 ? "🥇" : "🥈"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Standings Table */}
        <motion.div 
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
              📊 LEAGUE STANDINGS
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr className="text-white">
                  <th className="px-6 py-4 text-left font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left font-semibold">Team</th>
                  <th className="px-6 py-4 text-center font-semibold">W-L</th>
                  <th className="px-6 py-4 text-center font-semibold">Win %</th>
                  <th className="px-6 py-4 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => {
                  const rank = getRankDisplay(index)
                  const isTopTeam = index < 2
                  
                  return (
                    <motion.tr 
                      key={team.teamId} 
                      className={`border-b border-white/10 transition-all duration-300 hover:bg-white/5 ${
                        isTopTeam ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/30' : ''
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + (index * 0.1), duration: 0.4 }}
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{rank.emoji}</span>
                          <span className="text-xl font-bold text-white">{rank.text}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-6">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${team.color} flex items-center justify-center text-2xl shadow-lg`}>
                            {team.logo}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{team.teamName}</h3>
                            <p className="text-gray-400 text-sm">
                              {team.teamName === 'Imagine' ? '🎮 Your Team' : '🤖 Bot Team'}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-6 text-center">
                        <div className="text-xl font-bold text-white">
                          {team.wins}-{team.lose}
                        </div>
                      </td>
                      
                      <td className="px-6 py-6 text-center">
                        <div className="text-lg font-semibold text-white">
                          {getWinPercentage(team.wins, team.lose)}%
                        </div>
                      </td>
                      
                      <td className="px-6 py-6 text-center">
                        {team.wins === 0 && team.lose === 0 ? (
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-2 rounded-full text-sm font-semibold">
                            READY TO PLAY
                          </div>
                        ) : isTopTeam ? (
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-full text-sm font-semibold inline-flex items-center space-x-1">
                            <span>🏆</span>
                            <span>TOP PERFORMER</span>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-2 rounded-full text-sm font-semibold">
                            ACTIVE
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

    
      </div>
    </div>
  )
}

export default Standings
