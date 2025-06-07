'use client'

import React, { useState, useEffect } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

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

// Player interface
interface Player {
  id: number
  name: string
  age: number
  position: Position
  height: number
  overall: number
  tendency: Tendency
  isStarter: boolean
}

// Generate random player data
const generateRandomPlayers = (): Player[] => {
  const firstNames = ['Michael', 'LeBron', 'Kobe', 'Stephen', 'Kevin', 'Giannis', 'Luka', 'Nikola', 'Joel', 'Kawhi', 
                      'Damian', 'Jayson', 'Kyrie', 'Anthony', 'Jimmy', 'Devin', 'Zion', 'Trae', 'Ja', 'Donovan'];
  const lastNames = ['Jordan', 'James', 'Bryant', 'Curry', 'Durant', 'Antetokounmpo', 'Doncic', 'Jokic', 'Embiid', 'Leonard',
                     'Lillard', 'Tatum', 'Irving', 'Davis', 'Butler', 'Booker', 'Williamson', 'Young', 'Morant', 'Mitchell'];

  const positions = [Position.PG, Position.SG, Position.SF, Position.PF, Position.C];
  const tendencies = [Tendency.POST, Tendency.THREE_POINT, Tendency.MIDRANGE];

  // Helper function to get position-appropriate height
  const getHeightForPosition = (position: Position): number => {
    switch (position) {
      case Position.PG:
        return Math.floor(Math.random() * (185 - 175 + 1) + 175);
      case Position.SG:
        return Math.floor(Math.random() * (188 - 180 + 1) + 180);
      case Position.SF:
        return Math.floor(Math.random() * (190 - 185 + 1) + 185);
      case Position.PF:
        return Math.floor(Math.random() * (190 - 188 + 1) + 188);
      case Position.C:
        return 190; // Max height for Center
    }
  };

  // Create 10 players with 5 starters and 5 bench players
  const players: Player[] = [];
  
  // Ensure we have one of each position as starters
  positions.forEach((position, index) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    players.push({
      id: index + 1,
      name: `${firstName} ${lastName}`,
      age: 17,
      position: position,
      height: getHeightForPosition(position),
      overall: Math.floor(Math.random() * (99 - 75 + 1) + 75), // Overall between 75-99
      tendency: tendencies[Math.floor(Math.random() * tendencies.length)],
      isStarter: true
    });
  });

  // Add 5 bench players with random positions
  for (let i = 5; i < 10; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const position = positions[Math.floor(Math.random() * positions.length)];
    
    players.push({
      id: i + 1,
      name: `${firstName} ${lastName}`,
      age: 17,
      position: position,
      height: getHeightForPosition(position),
      overall: Math.floor(Math.random() * (85 - 70 + 1) + 70), // Bench players slightly lower overall (70-85)
      tendency: tendencies[Math.floor(Math.random() * tendencies.length)],
      isStarter: false
    });
  }

  return players;
};

// Player card component with drag functionality
const PlayerCard = ({ player, index, movePlayer, isStarter }: { 
  player: Player, 
  index: number, 
  movePlayer: (dragIndex: number, hoverIndex: number, fromStarter: boolean, toStarter: boolean) => void,
  isStarter: boolean 
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'player',
    item: { id: player.id, index, isStarter },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [, drop] = useDrop({
    accept: 'player',
    hover: (item: { id: number, index: number, isStarter: boolean }) => {
      if (item.index !== index || item.isStarter !== isStarter) {
        movePlayer(item.index, index, item.isStarter, isStarter);
        item.index = index;
        item.isStarter = isStarter;
      }
    },
  });

  // Get color based on overall rating
  const getOverallColor = (overall: number) => {
    if (overall >= 90) return 'text-yellow-400'; // Gold for elite
    if (overall >= 80) return 'text-green-500'; // Green for good
    if (overall >= 70) return 'text-blue-500';  // Blue for average
    return 'text-gray-500';                    // Gray for below average
  };

  // Get position color
  const getPositionColor = (position: Position) => {
    switch (position) {
      case Position.PG: return 'bg-blue-600';
      case Position.SG: return 'bg-green-600';
      case Position.SF: return 'bg-yellow-600';
      case Position.PF: return 'bg-red-600';
      case Position.C: return 'bg-purple-600';
    }
  };

  // Get tendency icon
  const getTendencyIcon = (tendency: Tendency) => {
    switch (tendency) {
      case Tendency.POST:
        return '🏀'; // Basketball for post play
      case Tendency.THREE_POINT:
        return '🎯'; // Target for 3-point shooter
      case Tendency.MIDRANGE:
        return '🔄'; // Cycle for midrange game
    }
  };
  return (
    <div
      ref={(node) => {
        drag(node);
        drop(node);
      }}
      className={`bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
      style={{ 
        width: '220px',
        borderRadius: '10px',
        margin: '0.5rem',
        cursor: 'move'
      }}
    >
      <div className={`h-2 ${getPositionColor(player.position)}`}></div>
      <div className="p-4 text-black">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-lg">{player.name}</span>
          <span className={`font-bold text-xl ${getOverallColor(player.overall)}`}>{player.overall}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <span className="font-semibold mr-1">Age:</span> {player.age}
          </div>
          <div className="flex items-center">
            <span className="font-semibold mr-1">Height:</span> {player.height}cm
          </div>
          <div className="flex items-center">
            <span className="font-semibold mr-1">Position:</span> 
            <span className={`text-white px-2 py-0.5 rounded-full text-xs ${getPositionColor(player.position)}`}>
              {player.position}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold mr-1">Style:</span> 
            <span className="flex items-center">
              {getTendencyIcon(player.tendency)} <span className="ml-1 text-xs">{player.tendency}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Team section component
const TeamSection = ({ title, players, movePlayer }: { 
  title: string, 
  players: Player[], 
  movePlayer: (dragIndex: number, hoverIndex: number, fromStarter: boolean, toStarter: boolean) => void 
}) => {
  const isStarter = title === 'Starters';
  
  return (
    <div className="bg-gray-800 bg-opacity-80 rounded-xl p-6 shadow-2xl">
      <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
        {isStarter ? (
          <Image src="/jerseyBasketball.svg" alt="Jersey" width={30} height={30} className="mr-2" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" className="mr-2" viewBox="0 0 16 16">
            <path d="M8 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
            <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1Z"/>
          </svg>
        )}
        {title}
      </h2>
      <div className="flex flex-wrap justify-center gap-4">
        {players.map((player, index) => (
          <PlayerCard 
            key={player.id} 
            player={player} 
            index={index} 
            movePlayer={movePlayer}
            isStarter={isStarter} 
          />
        ))}
      </div>
    </div>
  );
};

const ManagementPlan = () => {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    setPlayers(generateRandomPlayers());
  }, []);

  const movePlayer = (dragIndex: number, hoverIndex: number, fromStarter: boolean, toStarter: boolean) => {
    // Create a copy of the players array
    const updatedPlayers = [...players];
    
    // Get starters and bench arrays
    const starters = updatedPlayers.filter(player => player.isStarter);
    const bench = updatedPlayers.filter(player => !player.isStarter);
    
    // Get actual indices in the combined array
    let actualDragIndex: number;
    let actualHoverIndex: number;
    
    // Calculate the actual index in the full players array
    if (fromStarter) {
      actualDragIndex = updatedPlayers.findIndex(p => p.id === starters[dragIndex].id);
    } else {
      actualDragIndex = updatedPlayers.findIndex(p => p.id === bench[dragIndex].id);
    }
    
    // Get the player being dragged
    const draggedPlayer = updatedPlayers[actualDragIndex];
    
    // Remove the player from the old position
    updatedPlayers.splice(actualDragIndex, 1);
    
    // If moving to a different section, update isStarter status
    if (fromStarter !== toStarter) {
      draggedPlayer.isStarter = toStarter;
      
      // Recalculate starters and bench after removing the player
      const newStarters = updatedPlayers.filter(player => player.isStarter);
      const newBench = updatedPlayers.filter(player => !player.isStarter);
      
      // Determine insert position in the target section
      if (toStarter) {
        // Moving to starters - use hover index to determine position in starters
        actualHoverIndex = hoverIndex;
        
        // If we now have too many starters, move the last starter to bench
        if (newStarters.length >= 5) {
          const lastStarter = newStarters[newStarters.length - 1];
          const lastStarterIndex = updatedPlayers.findIndex(p => p.id === lastStarter.id);
          updatedPlayers[lastStarterIndex].isStarter = false;
        }
      } else {
        // Moving to bench - insert at hover position
        actualHoverIndex = newStarters.length + hoverIndex;
        
        // If we have too few starters, promote the first bench player
        if (newStarters.length < 4) { // We removed one, so we need at least 4
          if (newBench.length > 0) {
            const firstBench = newBench[0];
            const firstBenchIndex = updatedPlayers.findIndex(p => p.id === firstBench.id);
            updatedPlayers[firstBenchIndex].isStarter = true;
          }
        }
      }    } else {
      // If moving within the same section, use hover index
      if (toStarter) {
        // Moving within starters - calculate position relative to starters
        actualHoverIndex = hoverIndex;
      } else {
        // Moving within bench - calculate position relative to bench
        const newStarters = updatedPlayers.filter(player => player.isStarter);
        actualHoverIndex = newStarters.length + hoverIndex;
      }
    }
    
    // Insert the player at the new position
    // Handle the case where actualHoverIndex might be out of bounds
    if (actualHoverIndex > updatedPlayers.length) {
      actualHoverIndex = updatedPlayers.length;
    }
    
    updatedPlayers.splice(actualHoverIndex, 0, draggedPlayer);
    
    // Update the players state
    setPlayers(updatedPlayers);
  };

  // Filter players into starters and bench
  const starters = players.filter(player => player.isStarter);
  const bench = players.filter(player => !player.isStarter);  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 p-8 relative">
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
                alt="Back to Main Menu" 
                width={24} 
                height={24} 
                className="w-6 h-6 text-white group-hover:scale-110 transition-transform" 
              />
            </motion.div>
          </Link>
        </div>        <div 
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
        >
          <h1 className="text-4xl font-bold text-center mb-10 text-white drop-shadow-lg">
            Team Management
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <TeamSection title="Starters" players={starters} movePlayer={movePlayer} />
            <TeamSection title="Bench" players={bench} movePlayer={movePlayer} />
          </div>
          
          <div className="mt-10 text-center">
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-10 rounded-full shadow-lg transform transition hover:scale-105">
              Save Lineup
            </button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default ManagementPlan