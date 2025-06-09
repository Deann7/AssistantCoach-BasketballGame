'use client'

import React, { useState, useEffect } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { playersAPI, Player as APIPlayer } from '@/lib/api'

// Enum definitions
enum Position {
  PG = 'PG',
  SG = 'SG',
  SF = 'SF',
  PF = 'PF',
  C = 'C'
}

enum Tendency {
  POST = 'Post',
  THREE_POINT = '3pt pointer',
  MIDRANGE = 'Midrange'
}

// Player interface adapted from backend
interface Player {
  id: string
  name: string
  age: number
  position: Position
  height: number
  overall: number
  tendency: Tendency
  isStarter: boolean
}

// Convert backend player to frontend player format
const convertBackendPlayer = (backendPlayer: APIPlayer, isStarter: boolean = false): Player => {
  const tendencyMap: Record<string, Tendency> = {
    'POST': Tendency.POST,
    'THREE_POINT': Tendency.THREE_POINT,
    'MIDRANGE': Tendency.MIDRANGE
  };

  return {
    id: backendPlayer.playerName,
    name: backendPlayer.playerName,
    age: backendPlayer.playerAge,
    position: backendPlayer.playerPosition as Position,
    height: backendPlayer.playerHeight,
    overall: backendPlayer.playerRating,
    tendency: tendencyMap[backendPlayer.playerTendencies] || Tendency.MIDRANGE,
    isStarter: isStarter
  };
};

const ManagementPlan = () => {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userTeamId, setUserTeamId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const loadTeamPlayers = async () => {
      try {
        setLoading(true);
          // Get user info from localStorage
        const userDataString = localStorage.getItem('user');
        if (!userDataString) {
          setError('Please login first');
          router.push('/pages/login');
          return;
        }        const userData = JSON.parse(userDataString);
        console.log('User data from localStorage:', userData);
        const IMAGINE_TEAM_ID = 1;

        // Get players for team Imagine
        const playersResponse = await playersAPI.getPlayersByTeam(IMAGINE_TEAM_ID);
        console.log('Imagine team players response:', playersResponse);
        if (!playersResponse.success) {
          setError('Failed to load Imagine team players');
          return;
        }

        setUserTeamId(IMAGINE_TEAM_ID);
        if (!playersResponse.success) {
          setError('Failed to load Imagine team players');
          return;
        }

        // Convert backend players to frontend format
        const backendPlayers = playersResponse.players;
        const convertedPlayers = backendPlayers.map((player: APIPlayer, index: number) => 
          convertBackendPlayer(player, index < 5)
        );

        console.log('Converted players:', convertedPlayers);
        setPlayers(convertedPlayers);
        setError('');

      } catch (err: unknown) {
        console.error('Error loading team players:', err);
        setError('Failed to load team data');
      } finally {
        setLoading(false);
      }
    };    loadTeamPlayers();
  }, [router]);  const movePlayer = (dragIndex: number, hoverIndex: number, fromStarter: boolean, toStarter: boolean) => {
    setPlayers(prevPlayers => {
      const updatedPlayers = [...prevPlayers];
      const starters = updatedPlayers.filter(player => player.isStarter);
      const bench = updatedPlayers.filter(player => !player.isStarter);
      
      let draggedPlayer: Player;
      
      // Get the dragged player
      if (fromStarter) {
        draggedPlayer = starters[dragIndex];
      } else {
        draggedPlayer = bench[dragIndex];
      }
      
      // Find and remove the dragged player from the array
      const draggedPlayerIndex = updatedPlayers.findIndex(p => p.id === draggedPlayer.id);
      if (draggedPlayerIndex === -1) return prevPlayers; // Safety check
      
      updatedPlayers.splice(draggedPlayerIndex, 1);
      
      // Create a copy of the dragged player with updated starter status
      const movedPlayer = { ...draggedPlayer, isStarter: toStarter };
      
      // Handle cross-section movement (starter to bench or vice versa)
      if (fromStarter !== toStarter) {
        if (toStarter) {
          // Moving from bench to starters
          const currentStarters = updatedPlayers.filter(player => player.isStarter);
          
          // If starters would exceed 5, move the last starter to bench
          if (currentStarters.length >= 5) {
            const lastStarter = currentStarters[currentStarters.length - 1];
            lastStarter.isStarter = false;
          }
          
          // Add the new starter at the end of starters
          const startersCount = updatedPlayers.filter(player => player.isStarter).length;
          updatedPlayers.splice(startersCount, 0, movedPlayer);
        } else {
          // Moving from starters to bench
          // Add to the end of the array (after all starters)
          updatedPlayers.push(movedPlayer);
        }
      } else {
        // Same section reordering
        if (toStarter) {
          // Reordering within starters
          const startersAfterRemoval = updatedPlayers.filter(p => p.isStarter);
          const insertIndex = Math.min(hoverIndex, startersAfterRemoval.length);
          updatedPlayers.splice(insertIndex, 0, movedPlayer);
        } else {
          // Reordering within bench
          const startersCount = updatedPlayers.filter(player => player.isStarter).length;
          const benchAfterRemoval = updatedPlayers.filter(p => !p.isStarter);
          const insertIndex = startersCount + Math.min(hoverIndex, benchAfterRemoval.length);
          updatedPlayers.splice(insertIndex, 0, movedPlayer);
        }
      }
      
      return updatedPlayers;
    });
  };
  const saveLineup = async () => {
    if (!userTeamId) {
      setSaveMessage('No team selected');
      return;
    }

    try {
      setSaving(true);
      setSaveMessage('');

      const starters = players.filter(player => player.isStarter);
      const bench = players.filter(player => !player.isStarter);

      if (starters.length !== 5) {
        setSaveMessage('You must have exactly 5 starters');
        return;
      }

      const lineupData = {
        starters: starters.map(p => p.name),
        bench: bench.map(p => p.name)
      };

      console.log('Saving lineup for Imagine team:');
      console.log('Starters:', lineupData.starters);
      console.log('Bench:', lineupData.bench);

      // Save lineup using API
      const response = await playersAPI.saveLineup(userTeamId, lineupData);
      
      if (response.success) {
        setSaveMessage('✅ Lineup saved successfully!');
      } else {
        setSaveMessage('❌ Failed to save lineup: ' + response.message);
      }

      setTimeout(() => setSaveMessage(''), 3000);

    } catch (error) {
      console.error('Error saving lineup:', error);
      setSaveMessage('❌ Failed to save lineup');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };
  const starters = players.filter(player => player.isStarter);
  const bench = players.filter(player => !player.isStarter);

  console.log('Players data:', {
    totalPlayers: players.length,
    starters: starters.map((p, i) => ({ name: p.name, index: i, id: p.id })),
    bench: bench.map((p, i) => ({ name: p.name, index: i, id: p.id }))
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading team players...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Error: {error}</div>
          <Link href="/gamePage/mainMenu" className="text-blue-400 underline">
            Back to Main Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 p-8 relative">
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

        <div 
          className="max-w-7xl mx-auto"
          style={{
            backgroundImage: "url('/court.svg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            borderRadius: "20px",
            padding: "40px 20px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }}
        >          <h1 className="text-4xl font-extrabold text-center mb-10 text-white drop-shadow-lg">
           Team Management
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <TeamSection title="Starters" players={starters} movePlayer={movePlayer} />
            <TeamSection title="Bench" players={bench} movePlayer={movePlayer} />
          </div>
          
          <div className="mt-10 text-center space-y-4">
            <button 
              onClick={saveLineup}
              disabled={saving || starters.length !== 5}
              className={`font-bold py-3 px-10 rounded-full shadow-lg transform transition ${
                saving || starters.length !== 5
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 hover:scale-105'
              } text-white`}
            >
              {saving ? '💾 Saving...' : '💾 Save Lineup'}
            </button>
            
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-semibold"
              >
                {saveMessage}
              </motion.div>
            )}
              {starters.length !== 5 && (
              <div className="text-yellow-400 text-sm">
                ⚠️ You need exactly 5 starters to save the lineup
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

interface PlayerCardProps {
  player: Player;
  index: number;
  movePlayer: (dragIndex: number, hoverIndex: number, fromStarter: boolean, toStarter: boolean) => void;
  isStarter: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, index, movePlayer, isStarter }) => {
  console.log(`PlayerCard rendered: ${player.name}, index: ${index}, isStarter: ${isStarter}`);
  const [{ isDragging }, drag] = useDrag({
    type: 'player',
    item: () => {
      console.log(`Dragging ${player.name}, index: ${index}, isStarter: ${isStarter}`);
      return { index, isStarter, playerId: player.id };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'player',
    hover: (draggedItem: { index: number; isStarter: boolean; playerId: string }, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      
      // Prevent dropping on self
      if (draggedItem.playerId === player.id) return;
      
      // Allow reordering within same section or cross-section movement
      if (draggedItem.index !== index || draggedItem.isStarter !== isStarter) {
        movePlayer(draggedItem.index, index, draggedItem.isStarter, isStarter);
        draggedItem.index = index;
        draggedItem.isStarter = isStarter;
      }
    },
  });

  const getTendencyColor = (tendency: Tendency) => {
    switch (tendency) {
      case Tendency.POST:
        return 'bg-red-500';
      case Tendency.THREE_POINT:
        return 'bg-green-500';
      case Tendency.MIDRANGE:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };  const dragDropRef = (node: HTMLDivElement | null) => {
    if (node) {
      drag(drop(node));
    }
  };
  return (
    <div
      ref={dragDropRef}
      className={`bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-lg cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'hover:bg-white/20'
      }`}
      style={{
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s ease',
        userSelect: 'none', // Prevent text selection
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{player.name}</h3>
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-orange-400 font-semibold">{player.position}</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-300">{player.age}y</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-300">{player.height}&quot;</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{player.overall}</div>
          <div className={`text-xs text-white px-2 py-1 rounded-full ${getTendencyColor(player.tendency)}`}>
            {player.tendency}
          </div>        </div>
      </div>
    </div>
  );
};

interface TeamSectionProps {
  title: string;
  players: Player[];
  movePlayer: (dragIndex: number, hoverIndex: number, fromStarter: boolean, toStarter: boolean) => void;
}

const TeamSection: React.FC<TeamSectionProps> = ({ title, players, movePlayer }) => {
  const isStarter = title === 'Starters';

  return (
    <motion.div
      className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-6"
      initial={{ opacity: 0, x: isStarter ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          {isStarter ? '🏀' : '🪑'} {title}
        </h2>
        <div className="bg-orange-500/20 border border-orange-400/30 rounded-full px-3 py-1">
          <span className="text-orange-400 font-semibold">{players.length}</span>
        </div>
      </div>
        <div className="space-y-3 min-h-[300px]">
        {players.length === 0 ? (
          <div className="text-center py-8 text-gray-400 h-full flex flex-col justify-center">
            <div className="text-4xl mb-2">🏀</div>
            <p>Drag players here to add to {title.toLowerCase()}</p>
          </div>
        ) : (
          players.map((player, index) => (
            <PlayerCard
              key={player.id}
              player={player}
              index={index}
              movePlayer={movePlayer}
              isStarter={isStarter}
            />
          ))        )}
        
        {/* Drop zone for cross-section movement */}
        <SimpleDropZone isStarter={isStarter} movePlayer={movePlayer} players={players} />
      </div>
      
      {isStarter && players.length < 5 && (
        <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
          <p className="text-yellow-400 text-sm font-medium">
            ⚠️ Need {5 - players.length} more starter{5 - players.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </motion.div>
  );
};

// Simple drop zone component for cross-section movement
interface SimpleDropZoneProps {
  isStarter: boolean;
  movePlayer: (dragIndex: number, hoverIndex: number, fromStarter: boolean, toStarter: boolean) => void;
  players: Player[];
}

const SimpleDropZone: React.FC<SimpleDropZoneProps> = ({ isStarter, movePlayer, players }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'player',
    drop: (draggedItem: { index: number; isStarter: boolean }) => {
      // Only handle cross-section movement
      if (draggedItem.isStarter !== isStarter) {
        movePlayer(draggedItem.index, players.length, draggedItem.isStarter, isStarter);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const dropRef = (node: HTMLDivElement | null) => {
    drop(node);
  };

  return (
    <div 
      ref={dropRef}
      className={`h-16 border-2 border-dashed transition-all rounded-lg flex items-center justify-center ${
        isOver 
          ? 'border-orange-400 bg-orange-400/20 text-orange-400' 
          : 'border-white/20 text-white/40 hover:border-white/40'
      }`}
    >
      <span className="text-sm">
        Drop player here to {isStarter ? 'make starter' : 'move to bench'}
      </span>
    </div>
  );
};

export default ManagementPlan