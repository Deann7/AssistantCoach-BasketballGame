'use client'

import { useState, useEffect, useRef } from 'react'
import { teamsAPI, playersAPI, Player, Team, scheduleAPI } from '@/lib/api'
import { PlayStyle } from '@/components/CoachPopup'

// Interfaces
export interface GameState {
  homeScore: number
  awayScore: number
  quarter: number
  timeLeft: number // in seconds (60 seconds = 1 minute per quarter for testing)
  possession: 'home' | 'away'
  isPlaying: boolean
  gameEnded: boolean
}

export interface GameEvent {
  id: number | string
  time: string
  quarter: number
  event: string
  team: 'home' | 'away' | 'neutral'
  points?: number
  player?: string
  action?: 'shot' | 'rebound' | 'steal' | 'turnover' | 'assist' | 'timeout' | 'block'
  position?: { x: number; y: number }
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
    playerAge: 20 + Math.floor(Math.random() * 15), // Random age between 20-34
    playerHeight: 70 + Math.floor(Math.random() * 16), // Random height between 70-85 inches
    teamId: teamType === 'home' ? 1 : 2
  }))
}

// Custom hook for Game Engine
export const useGameEngine = () => {
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    homeScore: 0,
    awayScore: 0,
    quarter: 1,
    timeLeft: 60, // 1 minute per quarter for testing
    possession: 'home',
    isPlaying: false,
    gameEnded: false
  })
  // Teams and players
  const [homeTeam, setHomeTeam] = useState<GameTeam | null>(null)
  const [awayTeam, setAwayTeam] = useState<GameTeam | null>(null)
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([])
  
  // Animation and visual state
  const [playerPositions, setPlayerPositions] = useState<PlayerPosition[]>([])
  const [ballPosition, setBallPosition] = useState<BallPosition>({ x: 400, y: 200, isVisible: true })
  const [currentAction, setCurrentAction] = useState<string>('')
  
  // Game control state
  const [isSimulating, setIsSimulating] = useState(false)
  const [showCoachPopup, setShowCoachPopup] = useState(false)
  const [currentStrategy, setCurrentStrategy] = useState<PlayStyle | null>(null)
  
  // Loading and error state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
    // User data state
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
        }        const user = JSON.parse(storedUser)
        
        // Store user data in state for later use
        setUserData(user)

        // Get next fixture from localStorage (set by mainMenu) or use default
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
          }        } catch {
          console.warn('Failed to load teams from API, using mock data')
        }

        // If teams not found, create mock teams
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
          }        } catch {
          console.warn('Failed to load players from API, using mock data')
        }// If no players found, create mock players
        if (homePlayers.length === 0) {
          homePlayers = createMockPlayers('home', homeTeamData.teamName)
        }
        if (awayPlayers.length === 0) {
          awayPlayers = createMockPlayers('away', awayTeamData.teamName)
        }

        console.log('Home team players:', homePlayers)
        console.log('Away team players:', awayPlayers)

        // Log each player to debug name issues
        homePlayers.forEach((player: Player, index: number) => {
          console.log(`Home Player ${index + 1}:`, {
            playerName: player.playerName,
            playerPosition: player.playerPosition,
            playerRating: player.playerRating,
            playerTendencies: player.playerTendencies
          })
        })

        awayPlayers.forEach((player: Player, index: number) => {
          console.log(`Away Player ${index + 1}:`, {
            playerName: player.playerName,
            playerPosition: player.playerPosition,
            playerRating: player.playerRating,
            playerTendencies: player.playerTendencies
          })
        })

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

        // Initialize player positions
        initializePlayerPositions(homeTeamFull, awayTeamFull)

        setLoading(false)
      } catch (err) {
        console.error('Error loading game data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load game data')
        setLoading(false)
      }
    }

    loadGameData()
  }, [])

  // Initialize player positions on court
  const initializePlayerPositions = (home: GameTeam, away: GameTeam) => {
    const positions: PlayerPosition[] = []
    
    // Home team starting positions (left side)
    const homeStartingPlayers = home.players.slice(0, 5)
    homeStartingPlayers.forEach((player, index) => {
      positions.push({
        id: `home-${player.playerName}`,
        name: player.playerName,
        team: 'home',
        position: {
          x: 150 + (index % 2) * 60 + Math.random() * 20,
          y: 120 + (index * 40) + Math.random() * 15
        },
        isActive: true
      })
    })

    // Away team starting positions (right side)
    const awayStartingPlayers = away.players.slice(0, 5)
    awayStartingPlayers.forEach((player, index) => {
      positions.push({
        id: `away-${player.playerName}`,
        name: player.playerName,
        team: 'away',
        position: {
          x: 590 + (index % 2) * 60 + Math.random() * 20,
          y: 120 + (index * 40) + Math.random() * 15
        },
        isActive: true
      })
    })

    setPlayerPositions(positions)
  }

  // Enhanced animation function with better visual feedback
  const animateGameAction = (event: GameEvent) => {
    setCurrentAction(event.event)

    // Enhanced ball and player movement based on action type
    if (event.action === 'shot') {
      const targetX = event.team === 'home' ? 720 : 80
      const targetY = 200

      setBallPosition(prev => ({ ...prev, x: targetX, y: targetY }))
      
      // Players react to shot
      setPlayerPositions(prev => prev.map(player => {
        if (player.team === event.team) {
          return {
            ...player,
            position: {
              x: Math.max(80, Math.min(720, player.position.x + (Math.random() - 0.5) * 30)),
              y: Math.max(80, Math.min(320, player.position.y + (Math.random() - 0.5) * 20))
            }
          }
        }
        return player
      }))

      // Reset ball position after shot
      setTimeout(() => {
        setBallPosition(prev => ({ ...prev, x: 400, y: 200 }))
        if (homeTeam && awayTeam) {
          initializePlayerPositions(homeTeam, awayTeam)
        }
      }, 2000)

    } else if (event.action === 'rebound') {
      const reboundX = 300 + Math.random() * 200
      const reboundY = 150 + Math.random() * 100

      setBallPosition(prev => ({ ...prev, x: reboundX, y: reboundY }))
      
      // Players converge on rebound
      setPlayerPositions(prev => prev.map(player => ({
        ...player,
        position: {
          x: reboundX + (Math.random() - 0.5) * 100,
          y: reboundY + (Math.random() - 0.5) * 80
        }
      })))

      setTimeout(() => {
        setBallPosition(prev => ({ ...prev, x: 400, y: 200 }))
        if (homeTeam && awayTeam) {
          initializePlayerPositions(homeTeam, awayTeam)
        }
      }, 1500)    } else if (event.action === 'steal') {
      // Dramatic steal animation - players react strongly
      const stealX = 350 + Math.random() * 100
      const stealY = 180 + Math.random() * 40
      setPlayerPositions(prev => prev.map((player: PlayerPosition) => {
        if (player.team === event.team) {
          return {
            ...player,
            position: { x: stealX, y: stealY }
          }
        }
        // Opposing team players react more dramatically
        if (player.team !== event.team) {
          return {
            ...player,
            position: {
              x: player.position.x + (Math.random() - 0.5) * 35,
              y: player.position.y + (Math.random() - 0.5) * 35
            }
          }
        }
        return player
      }))
      
      setBallPosition(prev => ({ ...prev, x: stealX, y: stealY }))
      
      // Reset after steal
      setTimeout(() => {
        setBallPosition(prev => ({ ...prev, x: 400, y: 200 }))
        if (homeTeam && awayTeam) {
          initializePlayerPositions(homeTeam, awayTeam)
        }
      }, 1800)
      
    } else if (event.action === 'turnover') {
      // Ball moves randomly to show chaos
      setBallPosition(prev => ({ 
        ...prev, 
        x: 350 + Math.random() * 100, 
        y: 180 + Math.random() * 40 
      }))
      
      // Players scramble more dramatically
      setPlayerPositions(prev => prev.map(player => ({
        ...player,
        position: {
          x: Math.max(80, Math.min(720, player.position.x + (Math.random() - 0.5) * 40)),
          y: Math.max(80, Math.min(320, player.position.y + (Math.random() - 0.5) * 40))
        }
      })))
      
      setTimeout(() => {
        setBallPosition(prev => ({ ...prev, x: 400, y: 200 }))
        if (homeTeam && awayTeam) {
          initializePlayerPositions(homeTeam, awayTeam)
        }
      }, 1500)
    }
    
    // Clear action after animation
    setTimeout(() => {
      setCurrentAction('')
    }, 4000)
  }

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
      // Prefer guards and forwards for shooting
      eligiblePlayers = team.players.filter(p => 
        p.playerPosition === 'PG' || p.playerPosition === 'SG' || p.playerPosition === 'SF'
      )
      if (eligiblePlayers.length === 0) eligiblePlayers = team.players
    } else if (situation === 'rebounding') {
      // Prefer forwards and centers for rebounding
      eligiblePlayers = team.players.filter(p => 
        p.playerPosition === 'PF' || p.playerPosition === 'C' || p.playerPosition === 'SF'
      )
      if (eligiblePlayers.length === 0) eligiblePlayers = team.players
    } else if (situation === 'assist') {
      // Prefer guards for assists
      eligiblePlayers = team.players.filter(p => 
        p.playerPosition === 'PG' || p.playerPosition === 'SG'
      )
      if (eligiblePlayers.length === 0) eligiblePlayers = team.players
    } else if (situation === 'defense') {
      // Prefer athletic players for steals and blocks
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
      return team.players[0] || null // Fallback to first player
    }

    if (!selectedPlayer.playerName || selectedPlayer.playerName.trim() === '') {
      console.warn('Selected player has invalid name:', selectedPlayer)
      // Fix the player name if it's missing
      selectedPlayer.playerName = `Player #${Math.floor(Math.random() * 99) + 1}`
    }
    
    return selectedPlayer
  }
  // Enhanced game event generation with improved algorithms
  const generateGameEvent = (): Omit<GameEvent, 'id'> => {
    if (!homeTeam || !awayTeam) {
      return {
        time: formatTime(gameState.timeLeft),
        quarter: gameState.quarter,
        event: "Game loading...",
        team: 'neutral'
      }
    }

    // Validate teams have players
    if (!homeTeam.players || homeTeam.players.length === 0 || 
        !awayTeam.players || awayTeam.players.length === 0) {
      return {
        time: formatTime(gameState.timeLeft),
        quarter: gameState.quarter,
        event: "Teams are preparing...",
        team: 'neutral'
      }
    }

    const team = Math.random() > 0.5 ? 'home' : 'away'
    const currentTeam = team === 'home' ? homeTeam : awayTeam
    
    // Enhanced event probabilities based on realistic basketball flow
    const events = [
      { type: '3-point attempt', weight: 18, requiresPlayer: true },
      { type: '2-point attempt', weight: 28, requiresPlayer: true },
      { type: 'free throw', weight: 10, requiresPlayer: true },
      { type: 'turnover', weight: 10, requiresPlayer: true },
      { type: 'defensive rebound', weight: 12, requiresPlayer: true },
      { type: 'offensive rebound', weight: 8, requiresPlayer: true },
      { type: 'steal', weight: 6, requiresPlayer: true },
      { type: 'block', weight: 4, requiresPlayer: true },
      { type: 'assist', weight: 8, requiresPlayer: true },
      { type: 'timeout', weight: 2, requiresPlayer: false }
    ]

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

    if (selectedEvent.requiresPlayer) {
      switch (selectedEvent.type) {
        case '3-point attempt':
          player = getRandomPlayer(currentTeam, 'shooting')
          if (!player) {
            // Fallback to any player if no shooting specialist found
            player = getRandomPlayer(currentTeam)
            if (!player) {
              eventDescription = `${currentTeam.teamName} loses possession`
              return {
                time: formatTime(gameState.timeLeft),
                quarter: gameState.quarter,
                event: eventDescription,
                team: 'neutral'
              }
            }
          }
          // Enhanced 3-point shooting logic
          const baseThreeChance = 0.35
          const tendencyBonus = player.playerTendencies === 'THREE_POINT' ? 0.1 : 0
          const ratingMultiplier = player.playerRating / 100
          const threeMakeChance = (baseThreeChance + tendencyBonus) * ratingMultiplier
          
          if (Math.random() < threeMakeChance) {
            const shotTypes = ['corner three', 'beyond the arc', 'deep three', 'catch and shoot three']
            const shotType = shotTypes[Math.floor(Math.random() * shotTypes.length)]
            eventDescription = `${player.playerName} drains a ${shotType}! 🎯`
            points = 3
          } else {
            eventDescription = `${player.playerName} misses the 3-point attempt`
            points = 0
          }
          break

        case '2-point attempt':
          player = getRandomPlayer(currentTeam, 'shooting')
          if (!player) {
            // Fallback to any player if no shooting specialist found
            player = getRandomPlayer(currentTeam)
            if (!player) {
              eventDescription = `${currentTeam.teamName} loses possession`
              return {
                time: formatTime(gameState.timeLeft),
                quarter: gameState.quarter,
                event: eventDescription,
                team: 'neutral'
              }
            }
          }
          // Enhanced 2-point shooting with varied shot types
          const baseTwoChance = 0.50
          let tendencyBonus2pt = 0
          let shotDescription = ''
          
          if (player.playerTendencies === 'POST') {
            tendencyBonus2pt = 0.15
            shotDescription = 'post move'
          } else if (player.playerTendencies === 'MIDRANGE') {
            tendencyBonus2pt = 0.12
            shotDescription = 'midrange jumper'
          } else if (player.playerPosition === 'C' || player.playerPosition === 'PF') {
            shotDescription = 'close range shot'
            tendencyBonus2pt = 0.08
          } else {
            shotDescription = 'driving layup'
            tendencyBonus2pt = 0.05
          }
          
          const twoMakeChance = (baseTwoChance + tendencyBonus2pt) * (player.playerRating / 100)
          
          if (Math.random() < twoMakeChance) {
            eventDescription = `${player.playerName} scores with a ${shotDescription}! 🏀`
            points = 2
          } else {
            eventDescription = `${player.playerName} misses the ${shotDescription}`
            points = 0
          }
          break

        case 'free throw':
          player = getRandomPlayer(currentTeam)
          if (!player) {
            eventDescription = `${currentTeam.teamName} loses possession`
            return {
              time: formatTime(gameState.timeLeft),
              quarter: gameState.quarter,
              event: eventDescription,
              team: 'neutral'
            }
          }
          // Free throw percentage based on player rating
          const ftPercentage = 0.65 + (player.playerRating / 100) * 0.25 // 65-90% range
          if (Math.random() < ftPercentage) {
            eventDescription = `${player.playerName} sinks the free throw 🎯`
            points = 1
          } else {
            eventDescription = `${player.playerName} misses the free throw`
            points = 0
          }
          break

        case 'defensive rebound':
          player = getRandomPlayer(currentTeam, 'rebounding')
          if (!player) {
            player = getRandomPlayer(currentTeam)
            if (!player) {
              eventDescription = `${currentTeam.teamName} loses possession`
              return {
                time: formatTime(gameState.timeLeft),
                quarter: gameState.quarter,
                event: eventDescription,
                team: 'neutral'
              }
            }
          }
          const defRebVariations = [
            'secures the defensive board',
            'grabs the defensive rebound',
            'cleans up the glass',
            'pulls down the rebound'
          ]
          eventDescription = `${player.playerName} ${defRebVariations[Math.floor(Math.random() * defRebVariations.length)]} 💪`
          break

        case 'offensive rebound':
          player = getRandomPlayer(currentTeam, 'rebounding')
          if (!player) {
            player = getRandomPlayer(currentTeam)
            if (!player) {
              eventDescription = `${currentTeam.teamName} loses possession`
              return {
                time: formatTime(gameState.timeLeft),
                quarter: gameState.quarter,
                event: eventDescription,
                team: 'neutral'
              }
            }
          }
          const offRebVariations = [
            'fights for the offensive rebound',
            'gets the put-back opportunity',
            'keeps the possession alive',
            'grabs the offensive board'
          ]
          eventDescription = `${player.playerName} ${offRebVariations[Math.floor(Math.random() * offRebVariations.length)]} 🔥`
          break

        case 'turnover':
          player = getRandomPlayer(currentTeam)
          if (!player) {
            eventDescription = `${currentTeam.teamName} turns the ball over`
            return {
              time: formatTime(gameState.timeLeft),
              quarter: gameState.quarter,
              event: eventDescription,
              team: 'neutral',
              action: 'turnover'
            }
          }
          const turnoverTypes = [
            'turns the ball over',
            'loses control of the ball',
            'commits a traveling violation',
            'throws a bad pass'
          ]
          eventDescription = `${player.playerName} ${turnoverTypes[Math.floor(Math.random() * turnoverTypes.length)]} 😤`
          break

        case 'steal':
          player = getRandomPlayer(currentTeam, 'defense')
          if (!player) {
            player = getRandomPlayer(currentTeam)
            if (!player) {
              eventDescription = `${currentTeam.teamName} gets a steal`
              return {
                time: formatTime(gameState.timeLeft),
                quarter: gameState.quarter,
                event: eventDescription,
                team: team,
                action: 'steal'
              }
            }
          }
          const stealVariations = [
            'steals the ball',
            'picks off the pass',
            'strips the ball away',
            'intercepts the pass'
          ]
          eventDescription = `${player.playerName} ${stealVariations[Math.floor(Math.random() * stealVariations.length)]} 🥷`
          break

        case 'block':
          player = getRandomPlayer(currentTeam, 'defense')
          if (!player) {
            player = getRandomPlayer(currentTeam)
            if (!player) {
              eventDescription = `${currentTeam.teamName} gets a block`
              return {
                time: formatTime(gameState.timeLeft),
                quarter: gameState.quarter,
                event: eventDescription,
                team: team,
                action: 'block'
              }
            }
          }
          const blockVariations = [
            'blocks the shot',
            'swats the attempt away',
            'denies at the rim',
            'sends it back'
          ]
          eventDescription = `${player.playerName} ${blockVariations[Math.floor(Math.random() * blockVariations.length)]} ✋`
          break

        case 'assist':
          player = getRandomPlayer(currentTeam, 'assist')
          if (!player) {
            player = getRandomPlayer(currentTeam)
            if (!player) {
              eventDescription = `${currentTeam.teamName} makes a good pass`
              return {
                time: formatTime(gameState.timeLeft),
                quarter: gameState.quarter,
                event: eventDescription,
                team: team
              }
            }
          }
          const assistVariations = [
            'dishes a beautiful assist',
            'finds the open man',
            'sets up the score',
            'makes a perfect pass'
          ]
          eventDescription = `${player.playerName} ${assistVariations[Math.floor(Math.random() * assistVariations.length)]} 🎯`
          break

        default:
          player = getRandomPlayer(currentTeam)
          eventDescription = selectedEvent.type
          break
      }
    } else {
      // Non-player events (timeout)
      eventDescription = `${currentTeam.teamName} calls timeout ⏱️`
    }    // Fallback if no description was set
    if (!eventDescription) {
      eventDescription = `${currentTeam.teamName} in possession`
    }

    // Ensure player name is never undefined
    const finalPlayerName = player?.playerName && player.playerName.trim() !== '' 
      ? player.playerName 
      : `${currentTeam.teamName} Player`

    return {
      time: formatTime(gameState.timeLeft),
      quarter: gameState.quarter,
      event: eventDescription,
      team: team,
      points: points,
      player: selectedEvent.requiresPlayer ? finalPlayerName : undefined,
      action: points > 0 ? 'shot' : (selectedEvent.type.includes('rebound') ? 'rebound' : 
               selectedEvent.type === 'steal' ? 'steal' : 
               selectedEvent.type === 'turnover' ? 'turnover' : undefined)
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
  // Start game simulation
  const startGame = () => {
    if (gameState.gameEnded || !homeTeam || !awayTeam) return

    if (!gameState.isPlaying) {
      setGameState(prev => ({ ...prev, isPlaying: true }))
      setIsSimulating(true)

      intervalRef.current = setInterval(() => {
        setGameState(prev => {
          const newTimeLeft = prev.timeLeft - 1

          if (newTimeLeft <= 0) {
            // End of quarter logic
            if (prev.quarter < 4) {
              // Pause the game and stop the interval
              setIsSimulating(false)
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }
              
              // Show coach popup only in Q2
              if (prev.quarter === 2) {
                setShowCoachPopup(true)
              }
              
              // Move to next quarter but keep game paused
              return { ...prev, quarter: prev.quarter + 1, timeLeft: 60, isPlaying: false }
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

              return { ...prev, timeLeft: 0, isPlaying: false, gameEnded: true }
            }
          }

          return { ...prev, timeLeft: newTimeLeft }
        })

        // Generate game events less frequently - 30% chance every 3 seconds worth of time
        if (Math.random() < 0.3) { // 30% chance per second (reduced from 70%)
          const event: GameEvent = {
            id: Date.now(),
            ...generateGameEvent(),
          }

          setGameEvents(prevEvents => [event, ...prevEvents])

          // Animate the action
          if (event.action) {
            animateGameAction(event)
          }

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
    setIsSimulating(false);
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

  // New game function (without reset functionality as requested)
  const newGame = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    setGameState({
      homeScore: 0,
      awayScore: 0,
      quarter: 1,
      timeLeft: 60,
      possession: 'home',
      isPlaying: false,
      gameEnded: false
    })
    setGameEvents([])
    setIsSimulating(false)
    setShowCoachPopup(false)
    setCurrentStrategy(null)

    if (homeTeam && awayTeam) {
      initializePlayerPositions(homeTeam, awayTeam)
    }
    setBallPosition({ x: 400, y: 200, isVisible: true })
  }

  // Handle coach strategy selection
  const handleCoachStrategy = (strategy: PlayStyle) => {
    setCurrentStrategy(strategy)
    setShowCoachPopup(false)
  }
  // Continue to next quarter (for coach popup)
  const continueToNextQuarter = () => {
    setShowCoachPopup(false)
    // Don't automatically start the game - let user manually press start
  }

  // Skip coach popup
  const skipCoachPopup = () => {
    setShowCoachPopup(false)
    // Don't automatically start the game - let user manually press start
  }

  // Add this function
  const completeGameResult = async (homeScore: number, awayScore: number) => {
    const scheduleId = localStorage.getItem('currentScheduleId');
    if (!scheduleId) return;
    try {
      await scheduleAPI.completeGame({
        scheduleId: Number(scheduleId),
        homeScore,
        awayScore,
      });
    } catch (err) {
      console.error('Failed to complete game:', err);
    }
  };

  // Call completeGameResult in a useEffect when gameEnded becomes true
  useEffect(() => {
    if (gameState.gameEnded) {
      completeGameResult(gameState.homeScore, gameState.awayScore);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.gameEnded]);

  return {
    // Game state
    gameState,
    homeTeam,
    awayTeam,
    gameEvents,
    
    // Visual state
    playerPositions,
    ballPosition,
    currentAction,
    
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
