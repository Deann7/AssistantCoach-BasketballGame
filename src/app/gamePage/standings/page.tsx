'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface Team {
  id: number
  name: string
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  color: string
  logo: string
}

const Standings = () => {
  // Tournament data with all teams having played each other (round-robin format)
  const teams: Team[] = [
    {
      id: 1,
      name: "Thunder Hawks",
      wins: 4,
      losses: 0,
      pointsFor: 312,
      pointsAgainst: 245,
      color: "from-yellow-500 to-orange-600",
      logo: "🦅"
    },
    {
      id: 2,
      name: "Imagine",
      wins: 3,
      losses: 1,
      pointsFor: 298,
      pointsAgainst: 267,
      color: "from-purple-500 to-indigo-600",
      logo: "💫"
    },
    {
      id: 3,
      name: "Storm Breakers",
      wins: 2,
      losses: 2,
      pointsFor: 285,
      pointsAgainst: 289,
      color: "from-blue-500 to-cyan-600",
      logo: "⚡"
    },
    {
      id: 4,
      name: "Fire Dragons",
      wins: 1,
      losses: 3,
      pointsFor: 267,
      pointsAgainst: 295,
      color: "from-red-500 to-rose-600",
      logo: "🐉"
    },
    {
      id: 5,
      name: "Ice Wolves",
      wins: 0,
      losses: 4,
      pointsFor: 234,
      pointsAgainst: 300,
      color: "from-gray-500 to-slate-600",
      logo: "🐺"
    }
  ]

  const getWinPercentage = (wins: number, losses: number) => {
    const total = wins + losses
    return total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0"
  }

  const getPointDifferential = (pointsFor: number, pointsAgainst: number) => {
    const diff = pointsFor - pointsAgainst
    return diff > 0 ? `+${diff}` : diff.toString()
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6 relative">      {/* Navigation Button - Top Left */}
      <div className="absolute top-8 left-8 z-20">
        <Link href="/">
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
              alt="Back to Home" 
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
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            🏀 BASKETBALL STANDINGS
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-6">
            Season Tournament Results - Round Robin Format
          </p>
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full inline-block font-semibold shadow-lg">
            🏆 Top 2 Teams Advance to Finals!
          </div>
        </div>

        {/* Finals Qualification Banner */}
        <div className="mb-8 p-6 bg-gradient-to-r from-gold-400 via-yellow-500 to-orange-500 rounded-2xl shadow-2xl border-2 border-yellow-300">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              🏆 FINALS QUALIFIERS 🏆
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {teams.slice(0, 2).map((team, index) => (
                <div key={team.id} className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-3xl">{team.logo}</span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                      <p className="text-gray-800 font-semibold">{team.wins}-{team.losses} Record</p>
                    </div>
                    <span className="text-2xl">{index === 0 ? "🥇" : "🥈"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Standings Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
              📊 FINAL STANDINGS
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
                  <th className="px-6 py-4 text-center font-semibold">PF</th>
                  <th className="px-6 py-4 text-center font-semibold">PA</th>
                  <th className="px-6 py-4 text-center font-semibold">Diff</th>
                  <th className="px-6 py-4 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => {
                  const rank = getRankDisplay(index)
                  const isQualified = index < 2
                  
                  return (
                    <tr 
                      key={team.id} 
                      className={`border-b border-white/10 transition-all duration-300 hover:bg-white/5 ${
                        isQualified ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/30' : ''
                      }`}
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
                            <h3 className="text-xl font-bold text-white">{team.name}</h3>
                            <p className="text-gray-400 text-sm">
                              {isQualified ? '🏆 Finals Bound' : 'Season Complete'}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-6 text-center">
                        <div className="text-xl font-bold text-white">
                          {team.wins}-{team.losses}
                        </div>
                      </td>
                      
                      <td className="px-6 py-6 text-center">
                        <div className="text-lg font-semibold text-white">
                          {getWinPercentage(team.wins, team.losses)}%
                        </div>
                      </td>
                      
                      <td className="px-6 py-6 text-center">
                        <div className="text-lg text-blue-300 font-semibold">
                          {team.pointsFor}
                        </div>
                      </td>
                      
                      <td className="px-6 py-6 text-center">
                        <div className="text-lg text-red-300 font-semibold">
                          {team.pointsAgainst}
                        </div>
                      </td>
                      
                      <td className="px-6 py-6 text-center">
                        <div className={`text-lg font-semibold ${
                          team.pointsFor > team.pointsAgainst ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {getPointDifferential(team.pointsFor, team.pointsAgainst)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-6 text-center">
                        {isQualified ? (
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-full text-sm font-semibold inline-flex items-center space-x-1">
                            <span>🏆</span>
                            <span>QUALIFIED</span>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-gray-500 to-slate-600 text-white px-3 py-2 rounded-full text-sm font-semibold">
                            ELIMINATED
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tournament Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center">
              <span className="mr-2">📅</span>
              Tournament Format
            </h3>
            <p className="text-gray-300">
              Round Robin: Each team played every other team once for a total of 4 games per team.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center">
              <span className="mr-2">🏀</span>
              Total Games
            </h3>
            <p className="text-gray-300">
              10 games played in total across all matchups in the tournament.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center">
              <span className="mr-2">🏆</span>
              Finals
            </h3>
            <p className="text-gray-300">
              Thunder Hawks and Imagine advance to compete for the championship!
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">📝 Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-gray-300">
              <span className="font-semibold text-blue-300">PF:</span> Points For
            </div>
            <div className="text-gray-300">
              <span className="font-semibold text-red-300">PA:</span> Points Against
            </div>
            <div className="text-gray-300">
              <span className="font-semibold text-white">Diff:</span> Point Differential
            </div>
            <div className="text-gray-300">
              <span className="font-semibold text-white">Win %:</span> Win Percentage
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Standings