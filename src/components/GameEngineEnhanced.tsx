'use client'

import { useState, useEffect, useRef } from 'react'
import { teamsAPI, playersAPI, Player, Team, scheduleAPI, authAPI } from '@/lib/api'
import { PlayStyle } from '@/components/CoachPopup'

// Enhanced Interfaces
export interface GameState {
  homeScore: number
  awayScore: number
  quarter: number
  timeLeft: number // in seconds (480 seconds = 8 minutes per quarter for realistic feel)
  possession: 'home' | 'away'
  isPlaying: boolean
  gameEnded: boolean
  ballZone: 'home-paint' | 'home-three' | 'midcourt' | 'away-three' | 'away-paint' | 'home-freethrow' | 'away-freethrow'
  gameIntensity: 'low' | 'medium' | 'high' // Affects event frequency
  lastPlay: string // Description of last play
}

export interface GameEvent {
  id: number | string
  time: string
  quarter: number
  event: string
  team: 'home' | 'away' | 'neutral'
  points?: number
  player?: string
  position?: { x: number; y: number }
  shotType?: '3PT' | '2PT' | 'FT' | 'DUNK' | 'LAYUP'
  result?: 'MADE' | 'MISSED' | 'BLOCKED'
  description?: string // Detailed play description
  intensity?: 'normal' | 'exciting' | 'crucial'
}

export interface PlayerPosition {
  id: string
  name: string
  team: 'home' | 'away'
  position: { x: number; y: number }
  isActive: boolean
}

export interface BallPosition {
  x: number
  y: number
  isVisible: boolean
}

export interface CourtZone {
  name: string
  color: string
  description: string
}

export interface GameTeam {
  teamId: number
  teamName: string
  wins: number
  lose: number
  players: Player[]
}

// Helper function to create mock players
const createMockPlayers = (teamType: 'home' | 'away', teamName: string): Player[] => {
  const positions = ['PG', 'SG', 'SF', 'PF', 'C']
  const tendencies = ['POST', 'THREE_POINT', 'MIDRANGE']
  
  const homeNames = [
    'James Smith', 'Michael Johnson', 'David Brown', 'Chris Davis', 'Robert Wilson',
    'Daniel Taylor', 'Matthew Anderson', 'Anthony Thomas', 'Mark Jackson', 'Paul White'
  ]
  
  const awayNames = [
    'Carlos Rodriguez', 'Marcus Thompson', 'Kevin Williams', 'Tyler Martinez', 'Jordan Garcia',
    'Brandon Lopez', 'Austin Miller', 'Derek Jones', 'Trevor Adams', 'Cameron Clark'
  ]
  
  const playerNames = teamType === 'home' ? homeNames : awayNames
  return Array.from({ length: 10 }, (_, index) => ({
    playerId: (teamType === 'home' ? 100 : 200) + index + 1,
    playerName: playerNames[index] || `${teamName} Player ${index + 1}`,
    playerPosition: positions[index % 5] as 'PG' | 'SG' | 'SF' | 'PF' | 'C',
    playerRating: 65 + Math.floor(Math.random() * 30), // Random rating between 65-94
    playerTendencies: tendencies[Math.floor(Math.random() * tendencies.length)] as 'POST' | 'THREE_POINT' | 'MIDRANGE',
    playerAge: 20 + Math.floor(Math.random() * 15), 
    playerHeight: 70 + Math.floor(Math.random() * 16), 
    teamId: teamType === 'home' ? 1 : 2
  }))
}

// Custom hook for Enhanced Game Engine
export const useGameEngineEnhanced = () => {
  // Game state with enhanced features
  const [gameState, setGameState] = useState<GameState>({
    homeScore: 0,
    awayScore: 0,
    quarter: 1,
    timeLeft: 480, 
    possession: 'home',
    isPlaying: false,
    gameEnded: false,
    ballZone: 'midcourt',
    gameIntensity: 'medium',
    lastPlay: 'Game starting...'
  })

  // Teams and players
  const [homeTeam, setHomeTeam] = useState<GameTeam | null>(null)
  const [awayTeam, setAwayTeam] = useState<GameTeam | null>(null)
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([])
  
  // Game control state
  const [isSimulating, setIsSimulating] = useState(false)
  const [showCoachPopup, setShowCoachPopup] = useState(false)
  const [currentStrategy, setCurrentStrategy] = useState<PlayStyle | null>(null)
  
  // Loading and error state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<{ id: string; username: string } | null>(null)
  
  // Ref for game timer
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load game data on component mount
  useEffect(() => {
    const loadGameData = async () => {
      try {
        setLoading(true)
        
        // Get user from localStorage
        const storedUser = localStorage.getItem('user')
        if (!storedUser) {
          throw new Error('No user data found. Please login again.')
        }
        const user = JSON.parse(storedUser)
        
        // Store user data in state for later use
        setUserData(user)
        const nextFixture = localStorage.getItem('nextFixture')
        const fixture = nextFixture ? JSON.parse(nextFixture) : {
          id: 1,
          opponent: 'Riverlake Eagles',
          opponentLogo: '🦅',
          date: 'Today'
        }

        // Try to get teams data, if fails, create mock data
        let homeTeamData, awayTeamData
        try {
          const teamsResponse = await teamsAPI.getUserStandings(user.id)
          
          if (teamsResponse.success && teamsResponse.standings.length > 0) {
            const allTeams = teamsResponse.standings
            homeTeamData = allTeams.find((team: Team) => team.teamName === 'Imagine')
            awayTeamData = allTeams.find((team: Team) => team.teamName === fixture.opponent)
          }
        } catch {
          console.warn('Failed to load teams from API, using mock data')
        }

        if (!homeTeamData) {
          homeTeamData = {
            teamId: 1,
            teamName: 'Imagine',
            wins: 0,
            lose: 0
          }
        }

        if (!awayTeamData) {
          awayTeamData = {
            teamId: 2,
            teamName: fixture.opponent,
            wins: 0,
            lose: 0
          }
        }

        // Try to get players, if fails, create mock players
        let homePlayers = []
        let awayPlayers = []
        
        try {
          const homePlayersResponse = await playersAPI.getPlayersByTeam(homeTeamData.teamId)
          const awayPlayersResponse = await playersAPI.getPlayersByTeam(awayTeamData.teamId)

          if (homePlayersResponse.success) {
            homePlayers = homePlayersResponse.players || []
          }
          if (awayPlayersResponse.success) {
            awayPlayers = awayPlayersResponse.players || []
          }
        } catch {
          console.warn('Failed to load players from API, using mock data')
        }

        // If no players found, create mock players
        if (homePlayers.length === 0) {
          homePlayers = createMockPlayers('home', homeTeamData.teamName)
        }
        if (awayPlayers.length === 0) {
          awayPlayers = createMockPlayers('away', awayTeamData.teamName)
        }

        // Ensure players have required fields
        const validatePlayers = (players: Player[]) => {
          return players.map(player => ({
            ...player,
            playerName: player.playerName || 'Unknown Player',
            playerRating: player.playerRating || 50,
            playerPosition: player.playerPosition || 'PG',
            playerTendencies: player.playerTendencies || 'MIDRANGE'
          }))
        }

        // Prepare team data with players
        const homeTeamFull: GameTeam = {
          ...homeTeamData,
          players: validatePlayers(homePlayers)
        }

        const awayTeamFull: GameTeam = {
          ...awayTeamData,
          players: validatePlayers(awayPlayers)
        }

        setHomeTeam(homeTeamFull)
        setAwayTeam(awayTeamFull)

        setLoading(false)
      } catch (err) {
        console.error('Error loading game data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load game data')
        setLoading(false)
      }
    }

    loadGameData()
  }, [])

  // Format time to MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Enhanced player selection with better filtering and fallbacks
  const getRandomPlayer = (team: GameTeam, situation: string = 'any'): Player | null => {
    if (!team || !team.players || team.players.length === 0) {
      console.warn('No players found for team:', team?.teamName || 'Unknown Team')
      return null
    }
    
    let eligiblePlayers = team.players
    
    // Filter players based on situation with fallback
    if (situation === 'shooting') {
      eligiblePlayers = team.players.filter(p => 
        p.playerPosition === 'PG' || p.playerPosition === 'SG' || p.playerPosition === 'SF'
      )
      if (eligiblePlayers.length === 0) eligiblePlayers = team.players
    } else if (situation === 'rebounding') {
      eligiblePlayers = team.players.filter(p => 
        p.playerPosition === 'PF' || p.playerPosition === 'C' || p.playerPosition === 'SF'
      )
      if (eligiblePlayers.length === 0) eligiblePlayers = team.players
    } else if (situation === 'assist') {
      eligiblePlayers = team.players.filter(p => 
        p.playerPosition === 'PG' || p.playerPosition === 'SG'
      )
      if (eligiblePlayers.length === 0) eligiblePlayers = team.players
    } else if (situation === 'defense') {
      eligiblePlayers = team.players.filter(p => 
        p.playerRating >= 70 && (p.playerPosition === 'SF' || p.playerPosition === 'PF' || p.playerPosition === 'C')
      )
      if (eligiblePlayers.length === 0) eligiblePlayers = team.players
    }

    // Ensure we have eligible players
    if (eligiblePlayers.length === 0) {
      console.warn('No eligible players found for situation:', situation)
      return null
    }
    
    const selectedPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)]
    
    // Additional validation
    if (!selectedPlayer) {
      console.warn('Selected player is null')
      return team.players[0] || null
    }

    if (!selectedPlayer.playerName || selectedPlayer.playerName.trim() === '') {
      console.warn('Selected player has invalid name:', selectedPlayer)
      selectedPlayer.playerName = `Player #${Math.floor(Math.random() * 99) + 1}`
    }
    
    return selectedPlayer
  }

  // Enhanced game event generation with more realistic basketball flow and timing
  const generateGameEvent = (): Omit<GameEvent, 'id'> => {
    if (!homeTeam || !awayTeam) {
      return {
        time: formatTime(gameState.timeLeft),
        quarter: gameState.quarter,
        event: "Game loading...",
        team: 'neutral',
        description: "Setting up the court..."
      }
    }

    // Validate teams have players
    if (!homeTeam.players || homeTeam.players.length === 0 || 
        !awayTeam.players || awayTeam.players.length === 0) {
      return {
        time: formatTime(gameState.timeLeft),
        quarter: gameState.quarter,
        event: "Teams are preparing...",
        team: 'neutral',
        description: "Players warming up..."
      }
    }

    const team = gameState.possession
    const currentTeam = team === 'home' ? homeTeam : awayTeam
    const opponentTeam = team === 'home' ? awayTeam : homeTeam
    
    // More realistic event probabilities with context awareness
    const baseEvents = [
      { type: 'dribble-advance', weight: 25, requiresPlayer: true },
      { type: '3-point attempt', weight: 15, requiresPlayer: true },
      { type: '2-point attempt', weight: 20, requiresPlayer: true },
      { type: 'layup attempt', weight: 12, requiresPlayer: true },
      { type: 'pass', weight: 20, requiresPlayer: true },
      { type: 'turnover', weight: 8, requiresPlayer: true },
      { type: 'steal', weight: 4, requiresPlayer: true },
      { type: 'foul', weight: 6, requiresPlayer: true },
      { type: 'timeout', weight: 2, requiresPlayer: false }
    ]

    // Adjust weights based on game context
    const events = [...baseEvents]
    
    // More aggressive play in final quarter
    if (gameState.quarter === 4) {
      events.find(e => e.type === '3-point attempt')!.weight += 5
      events.find(e => e.type === 'steal')!.weight += 3
    }
    
    // More aggressive play in final minutes
    if (gameState.quarter === 4 && gameState.timeLeft < 120) {
      events.find(e => e.type === 'foul')!.weight += 4
      events.find(e => e.type === '3-point attempt')!.weight += 3
    }

    // Weighted random selection
    const totalWeight = events.reduce((sum, event) => sum + event.weight, 0)
    let random = Math.random() * totalWeight
    let selectedEvent = events[0]

    for (const event of events) {
      random -= event.weight
      if (random <= 0) {
        selectedEvent = event
        break
      }
    }

    let player: Player | null = null
    let eventDescription = ''
    let points = 0
    let shotType: '3PT' | '2PT' | 'FT' | 'DUNK' | 'LAYUP' | undefined
    let result: 'MADE' | 'MISSED' | 'BLOCKED' | undefined
    let intensity: 'normal' | 'exciting' | 'crucial' = 'normal'

    if (selectedEvent.requiresPlayer) {
      switch (selectedEvent.type) {
        case 'dribble-advance':
          player = getRandomPlayer(currentTeam, 'any')
          if (!player) break
          eventDescription = `🏃‍♂️ ${player.playerName} brings the ball up court`
          break

        case '3-point attempt':
          player = getRandomPlayer(currentTeam, 'shooting')
          if (!player) break
          
          const threeSuccess = Math.random() < 0.35 // 35% success rate
          shotType = '3PT'
          result = threeSuccess ? 'MADE' : 'MISSED'
          points = threeSuccess ? 3 : 0
          
          if (threeSuccess) {
            eventDescription = `🎯 ${player.playerName} drains a three-pointer!`
            intensity = 'exciting'
          } else {
            eventDescription = `${player.playerName} misses from three-point range`
          }
          break

        case '2-point attempt':
          player = getRandomPlayer(currentTeam, 'shooting')
          if (!player) break
          
          const twoSuccess = Math.random() < 0.48 // 48% success rate
          shotType = '2PT'
          result = twoSuccess ? 'MADE' : 'MISSED'
          points = twoSuccess ? 2 : 0
          
          if (twoSuccess) {
            eventDescription = `🏀 ${player.playerName} scores on a mid-range jumper`
          } else {
            eventDescription = `${player.playerName} misses the mid-range shot`
          }
          break

        case 'layup attempt':
          player = getRandomPlayer(currentTeam, 'any')
          if (!player) break
          
          const layupSuccess = Math.random() < 0.65 // 65% success rate
          shotType = 'LAYUP'
          result = layupSuccess ? 'MADE' : 'MISSED'
          points = layupSuccess ? 2 : 0
          
          if (layupSuccess) {
            eventDescription = `⚡ ${player.playerName} scores an easy layup!`
          } else {
            eventDescription = `${player.playerName} misses the layup`
          }
          break

        case 'pass':
          const passer = getRandomPlayer(currentTeam, 'assist')
          const receiver = getRandomPlayer(currentTeam, 'any')
          if (!passer || !receiver || passer === receiver) {
            player = passer || receiver
            eventDescription = `${player?.playerName || 'Player'} looks for an open teammate`
          } else {
            player = passer
            eventDescription = `⚡ ${passer.playerName} passes to ${receiver.playerName}`
          }
          break

        case 'turnover':
          player = getRandomPlayer(currentTeam, 'any')
          const defPlayer = getRandomPlayer(opponentTeam, 'defense')
          if (!player) break
          
          const turnoverTypes = ['travels', 'loses the ball', 'commits an offensive foul', 'throws it away']
          const turnoverType = turnoverTypes[Math.floor(Math.random() * turnoverTypes.length)]
          
          eventDescription = `💔 ${player.playerName} ${turnoverType}${defPlayer ? ` to ${defPlayer.playerName}` : ''}`
          break

        case 'steal':
          const stealPlayer = getRandomPlayer(opponentTeam, 'defense')
          const victimPlayer = getRandomPlayer(currentTeam, 'any')
          if (!stealPlayer || !victimPlayer) break
          
          player = stealPlayer
          eventDescription = `🔥 ${stealPlayer.playerName} steals the ball from ${victimPlayer.playerName}!`
          intensity = 'exciting'
          break

        case 'foul':
          const fouler = getRandomPlayer(opponentTeam, 'any')
          const fouled = getRandomPlayer(currentTeam, 'any')
          if (!fouler || !fouled) break
          
          player = fouler
          const isShootingFoul = Math.random() < 0.4
          
          if (isShootingFoul) {
            eventDescription = `⚠️ ${fouler.playerName} commits a shooting foul on ${fouled.playerName}`
          } else {
            eventDescription = `⚠️ ${fouler.playerName} fouls ${fouled.playerName}`
          }
          break

        default:
          player = getRandomPlayer(currentTeam, 'any')
          eventDescription = `${player?.playerName || 'Player'} has the ball`
      }
    } else {
      // Non-player events like timeouts
      if (selectedEvent.type === 'timeout') {
        eventDescription = `⏱️ ${currentTeam.teamName} calls a timeout`
      }
    }

    if (!eventDescription) {
      eventDescription = `${currentTeam.teamName} maintains possession`
    }

    // Determine if this is a crucial moment
    if (gameState.quarter === 4 && gameState.timeLeft < 60) {
      intensity = 'crucial'
    } else if (Math.abs(gameState.homeScore - gameState.awayScore) <= 3) {
      intensity = 'exciting'
    }

    // Ensure player name is never undefined
    const finalPlayerName = player?.playerName && player.playerName.trim() !== '' 
      ? player.playerName 
      : `${currentTeam.teamName} Player`

    return {
      time: formatTime(gameState.timeLeft),
      quarter: gameState.quarter,
      event: eventDescription,
      team,
      points,
      player: finalPlayerName,
      shotType,
      result,
      description: eventDescription,
      intensity,
      position: { x: Math.random() * 800, y: Math.random() * 400 }
    }
  }

  // Update team records after game completion
  const updateTeamRecords = async (result: { winner: string; homeTeam: string; awayTeam: string }) => {
    try {
      if (homeTeam && awayTeam) {
        if (result.winner === homeTeam.teamName) {
          await teamsAPI.updateTeamRecord(homeTeam.teamId, 'win')
          await teamsAPI.updateTeamRecord(awayTeam.teamId, 'loss')
        } else if (result.winner === awayTeam.teamName) {
          await teamsAPI.updateTeamRecord(awayTeam.teamId, 'win')
          await teamsAPI.updateTeamRecord(homeTeam.teamId, 'loss')
        }
      }
    } catch (error) {
      console.error('Error updating team records:', error)
    }
  }

  // Start game simulation with enhanced timing
  const startGame = () => {
    if (gameState.gameEnded || !homeTeam || !awayTeam) return

    if (!gameState.isPlaying) {
      setGameState(prev => ({ ...prev, isPlaying: true }))
      setIsSimulating(true)
      
      intervalRef.current = setInterval(() => {
        setGameState(prev => {
          const newTimeLeft = prev.timeLeft - 1

          if (newTimeLeft <= 0) {
            if (prev.quarter < 4) {
              setIsSimulating(false)
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }
              
  
              if (prev.quarter === 2) {
                setShowCoachPopup(true)
              }
              
              // Move to next quarter but keep game paused
              return { 
                ...prev, 
                quarter: prev.quarter + 1, 
                timeLeft: 480, 
                isPlaying: false,
                lastPlay: `End of Quarter ${prev.quarter}`
              }
            } else {
              // End of game
              setIsSimulating(false)
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
              }

              // Determine winner and update records
              const imagineScore = homeTeam.teamName === 'Imagine' ? prev.homeScore : prev.awayScore
              const opponentScore = homeTeam.teamName === 'Imagine' ? prev.awayScore : prev.homeScore
              
              const gameResult = {
                winner: imagineScore > opponentScore ? 'Imagine' : 
                       opponentScore > imagineScore ? awayTeam.teamName : 'TIE',
                homeTeam: homeTeam.teamName,
                awayTeam: awayTeam.teamName,
                homeScore: prev.homeScore,
                awayScore: prev.awayScore
              }

              updateTeamRecords(gameResult)

              return { 
                ...prev, 
                timeLeft: 0, 
                isPlaying: false, 
                gameEnded: true,
                lastPlay: 'Game Over!'
              }
            }
          }
          
          return { 
            ...prev, 
            timeLeft: newTimeLeft
          }
        })

   
        if (Math.random() < 0.08) { // 8% chance per second (slower paced)
          const event: GameEvent = {
            id: Date.now(),
            ...generateGameEvent(),
          }

          setGameEvents(prevEvents => [event, ...prevEvents])
          
          // Update gameState with the new info from event
          setGameState(prevState => ({
            ...prevState,
            lastPlay: event.description || event.event
          }))

          // Update score
          if (event.points && event.points > 0) {
            setGameState(prevState => ({
              ...prevState,
              homeScore: event.team === 'home' ? prevState.homeScore + event.points! : prevState.homeScore,
              awayScore: event.team === 'away' ? prevState.awayScore + event.points! : prevState.awayScore,
              possession: event.team === 'home' ? 'away' : 'home' // Switch possession after score
            }))
          }
        }
      }, 1000) // 1 second intervals
    }
  }

  // Pause game
  const pauseGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: false }))
    setIsSimulating(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // New game function
  const newGame = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    setGameState({
      homeScore: 0,
      awayScore: 0,
      quarter: 1,
      timeLeft: 480,
      possession: 'home',
      isPlaying: false,
      gameEnded: false,
      ballZone: 'midcourt',
      gameIntensity: 'medium',
      lastPlay: 'Game starting...'
    })
    setGameEvents([])
    setIsSimulating(false)
    setShowCoachPopup(false)
    setCurrentStrategy(null)
  }

  // Handle coach strategy selection
  const handleCoachStrategy = (strategy: PlayStyle) => {
    setCurrentStrategy(strategy)
    setShowCoachPopup(false)
  }

  // Continue to next quarter (for coach popup)
  const continueToNextQuarter = () => {
    setShowCoachPopup(false)
  }

  // Skip coach popup
  const skipCoachPopup = () => {
    setShowCoachPopup(false)
  }

  // Complete game result
  const completeGameResult = async (homeScore: number, awayScore: number) => {
    const scheduleId = localStorage.getItem('currentScheduleId')
    if (!scheduleId) return
    try {
      await scheduleAPI.completeGame({
        scheduleId: Number(scheduleId),
        homeScore,
        awayScore,
      })
    } catch (err) {
      console.error('Failed to complete game:', err)
    }
  }

  // Call completeGameResult and update emotions when gameEnded becomes true
  useEffect(() => {
    if (gameState.gameEnded && userData) {
      // Complete the game in the database
      completeGameResult(gameState.homeScore, gameState.awayScore)
      
      // Update coach emotions based on game result
      const updateEmotions = async () => {
        try {
          // Determine if this is a win or loss for the user's team
          const imagineScore = homeTeam?.teamName === 'Imagine' ? gameState.homeScore : gameState.awayScore
          const opponentScore = homeTeam?.teamName === 'Imagine' ? gameState.awayScore : gameState.homeScore
          
          const gameResult = imagineScore > opponentScore ? 'win' : 'loss'
            
          // Call the emotion update API
          const response = await authAPI.updateEmotions(userData.id, gameResult)
          
          if (response.success) {
            console.log('Emotions updated successfully:', response)
          } else {
            console.error('Failed to update emotions:', response.message)
          }
        } catch (error) {
          console.error('Error updating emotions after game:', error)
        }
      }
      
      updateEmotions()
    }
  }, [gameState.gameEnded, gameState.homeScore, gameState.awayScore, userData, homeTeam])

  return {
    // Game state
    gameState,
    homeTeam,
    awayTeam,
    gameEvents,
    
    // Control state
    isSimulating,
    showCoachPopup,
    currentStrategy,
    
    // Loading state
    loading,
    error,
    
    // Actions
    startGame,
    pauseGame,
    newGame,
    handleCoachStrategy,
    continueToNextQuarter,
    skipCoachPopup,
    
    // Utilities
    formatTime
  }
}
