"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MusicPlayer from '@/components/MusicPlayer';
import { User, teamsAPI, scheduleAPI } from '@/lib/api';

interface Fixture {
  id: number;
  opponent: string;
  opponentLogo: string;
  date: string;
}

const MainMenu = () => {
  const [coachName, setCoachName] = useState<string>("Coach");
  const [isClient, setIsClient] = useState(false);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const router = useRouter();
  
  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/pages/login');
  };

  // Handle Game Play click - save next fixture to localStorage
  const handleGamePlayClick = () => {
    if (fixtures.length > 0) {
      localStorage.setItem('nextFixture', JSON.stringify(fixtures[0]));
    }
  };

  // Coach trust status - you can modify these values or fetch from API
  const coachTrustData = {
    goodEmotion: 75, // 0-100 scale
    badEmotion: 25,  // 0-100 scale
    satisfaction: 85 // 0-100 scale
  };  useEffect(() => {
    // This helps with hydration issues
    setIsClient(true);
    
    // Get user data from localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user: User = JSON.parse(storedUser);
        setCoachName(user.username);
      } else {
        // If no user data found, redirect to login
        router.push('/pages/login');
        return;
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      // If error parsing data, redirect to login
      router.push('/pages/login');
      return;
    }

    // Generate fixtures for "Imagine" team
    const generateFixtures = async () => {
      try {
        // Get user data from localStorage
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          console.error('No user data found');
          return;
        }
        
        const user = JSON.parse(storedUser);
        
        // First, try to get the next scheduled game
        try {
          const nextGameResponse = await scheduleAPI.getNextGame(user.id);
          if (nextGameResponse.success && nextGameResponse.game) {
            const game = nextGameResponse.game;
            
            // Team display data for logos
            const teamLogos: Record<string, string> = {
              'Riverlake Eagles': '🦅',
              'Storm Breakers': '⚡',
              'Red Dragons': '🐉',
              'Wolverines': '🐺',
              'Golden Tigers': '🐅'
            };

            // Determine opponent (if user team is home, opponent is away team, and vice versa)
            let opponentName = '';
            if (game.homeTeamId === 5) { // Imagine team ID
              opponentName = game.awayTeamName || 'Unknown Team';
            } else {
              opponentName = game.homeTeamName || 'Unknown Team';
            }

            const nextFixture: Fixture[] = [{
              id: game.scheduleId,
              opponent: opponentName,
              opponentLogo: teamLogos[opponentName] || '🏀',
              date: new Date(game.gameDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                weekday: 'short'
              })
            }];

            setFixtures(nextFixture);
            return;
          }
        } catch (scheduleError) {
          console.log('No scheduled games found, generating schedule...', scheduleError);
        }

        // If no schedule exists, try to generate one
        try {
          const generateResponse = await scheduleAPI.generateSchedule(user.id);
          if (generateResponse.success) {
            console.log('Schedule generated successfully');
            // Retry getting next game after generation
            const nextGameResponse = await scheduleAPI.getNextGame(user.id);
            if (nextGameResponse.success && nextGameResponse.game) {
              const game = nextGameResponse.game;
              
              // Team display data for logos
              const teamLogos: Record<string, string> = {
                'Riverlake Eagles': '🦅',
                'Storm Breakers': '⚡',
                'Red Dragons': '🐉',
                'Wolverines': '🐺',
                'Golden Tigers': '🐅'
              };

              // Determine opponent
              let opponentName = '';
              if (game.homeTeamId === 5) { // Imagine team ID
                opponentName = game.awayTeamName || 'Unknown Team';
              } else {
                opponentName = game.homeTeamName || 'Unknown Team';
              }

              const nextFixture: Fixture[] = [{
                id: game.scheduleId,
                opponent: opponentName,
                opponentLogo: teamLogos[opponentName] || '🏀',
                date: new Date(game.gameDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  weekday: 'short'
                })
              }];

              setFixtures(nextFixture);
              return;
            }
          }
        } catch (generateError) {
          console.log('Schedule generation failed, falling back to standings-based fixtures...', generateError);
        }

        // Fallback: Use team standings to create a basic fixture
        const response = await teamsAPI.getUserStandings(user.id);
        if (response.success) {
          // Store standings in localStorage for gamePlay to update
          localStorage.setItem('teamStandings', JSON.stringify(response.standings));
          
          // Team display data for logos
          const teamLogos: Record<string, string> = {
            'Riverlake Eagles': '🦅',
            'Storm Breakers': '⚡',
            'Red Dragons': '🐉',
            'Wolverines': '🐺',
            'Golden Tigers': '🐅'
          };

          // Filter out "Imagine" team and create fixtures
          const otherTeams = response.standings.filter((team: { teamName: string }) => team.teamName !== 'Imagine');
          
          // Generate only next fixture
          const baseDate = new Date('2025-06-15'); // Starting from June 15, 2025
          const nextFixture: Fixture[] = otherTeams.slice(0, 1).map((team: { teamName: string }, index: number) => {
            const fixtureDate = new Date(baseDate);
            
            return {
              id: index + 1,
              opponent: team.teamName,
              opponentLogo: teamLogos[team.teamName] || '🏀',
              date: fixtureDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                weekday: 'short'
              })
            };
          });

          setFixtures(nextFixture);
        } else {
          // If no teams found, try to setup user league
          if (response.message?.includes('No teams found')) {
            const setupResponse = await teamsAPI.setupUserLeague(user.id);
            if (setupResponse.success) {
              // Retry after setup
              setTimeout(generateFixtures, 1000);
            }
          }
        }
      } catch (error) {
        console.error('Error generating fixtures:', error);
        // Fallback fixtures if API fails - only show one
        setFixtures([
          {
            id: 1,
            opponent: 'Riverlake Eagles',
            opponentLogo: '🦅',
            date: 'Jun 15, Sun'
          }
        ]);
      }
    };

    generateFixtures();
  }, [router]);
  // Note: router is used only for error redirects, including it would cause infinite loops

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      }
    }
  };

  const menuItems = [
    {
      title: 'Game Play',
      description: 'Start coaching your team in a live game',
      icon: '/court.svg',
      link: '/gamePage/gamePlay'
    },
    {
      title: 'Management Plan',
      description: 'Develop strategies and manage your team',
      icon: '/jerseyBasketball.svg',
      link: '/gamePage/managementPlan'
    },
    {
      title: 'Standings',
      description: 'View league standings and stats',
      icon: '/standings.svg',
      link: '/gamePage/standings'
    },
    {
      title: 'Exit Game',
      description: 'Return to main menu',
      icon: '/exit.svg',
      link: '/'
    }
  ];

  if (!isClient) {
    return null; // Prevents hydration errors
  }
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 px-4 py-12 overflow-hidden">
      {/* Music Player Component */}
      <MusicPlayer />
      
      {/* Basketball background elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
      
      {/* Basketball court lines (decorative) */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/70" />
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/70" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 border-4 border-white/70 rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Main content */}
      <motion.div 
        className="container mx-auto max-w-5xl relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >        {/* Header section */}
        <motion.div 
          className="text-center mb-12" 
          variants={itemVariants}
        >
            <div className='fixed top-4 left-4 z-50 flex items-center gap-4'>
            <motion.button
              onClick={handleLogout}
              className="bg-red-500/80 hover:bg-red-600 backdrop-blur-lg px-4 py-2 rounded-xl text-white font-semibold border border-red-300/20 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Logout
            </motion.button>
            </div>


          <div className="flex justify-center mb-6">
            <Image 
              src="/basketball.svg" 
              alt="Basketball" 
              width={80} 
              height={80} 
              className="animate-bounce" 
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Assistant Coach Dashboard
          </h1>
          <p className="text-xl md:text-2xl text-orange-300 font-semibold">
            Welcome Back, Assistant Coach {coachName}
          </p>
        </motion.div>        {/* Menu grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {menuItems.map((item, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {item.title === 'Game Play' ? (
                <Link href={item.link} onClick={handleGamePlayClick}>
                  <div className="bg-white/10 backdrop-blur-lg hover:bg-white/20 p-6 rounded-2xl border border-white/20 shadow-xl transition-all group">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-br from-orange-400 to-red-500 p-3 rounded-xl shadow-lg group-hover:shadow-orange-500/30 transition-all">
                        <Image 
                          src={item.icon} 
                          alt={item.title} 
                          width={40} 
                          height={40} 
                          className="w-10 h-10" 
                        />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                          {item.title}
                        </h2>
                        <p className="text-gray-300">
                          {item.description}
                        </p>
                        {fixtures.length > 0 && (
                          <p className="text-orange-300 text-sm mt-1">
                            Next: vs {fixtures[0].opponent} on {fixtures[0].date}
                          </p>
                        )}
                      </div>
                      <div className="text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link href={item.link}>
                  <div className="bg-white/10 backdrop-blur-lg hover:bg-white/20 p-6 rounded-2xl border border-white/20 shadow-xl transition-all group">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-br from-orange-400 to-red-500 p-3 rounded-xl shadow-lg group-hover:shadow-orange-500/30 transition-all">
                        <Image 
                          src={item.icon} 
                          alt={item.title} 
                          width={40} 
                          height={40} 
                          className="w-10 h-10" 
                        />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                          {item.title}
                        </h2>
                        <p className="text-gray-300">
                          {item.description}
                        </p>
                      </div>
                      <div className="text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </motion.div>
          ))}
        </div>        {/* Footer section */}
        <div className='flex flex-row gap-8 max-md:flex-col items-start justify-center mt-12'>
          {/* Coach Image */}
          <div className='mb-8 flex-shrink-0'>
             <Image 
              src="/coach_image.png" 
              alt="Coach John Doe" 
              width={160} 
              height={200} 
            />
          </div>
          
          {/* Coach Trust Status - 3/4 width */}
          <motion.div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl flex-grow max-w-2xl"
            variants={itemVariants}
          >            <h3 className="text-2xl font-bold text-white mb-6 text-center">
             Emotion Bar
            </h3>
            
            <div className='grid grid-cols-2 gap-6'>
              {/* Good Emotion Bar */}
              <div className="flex flex-col items-center">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">😊</span>
                  <span className="text-white font-semibold">Good Emotion</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center"
                    initial={{ width: 0 }}
                    animate={{ width: `${coachTrustData.goodEmotion}%` }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  >
                    <span className="text-white text-sm font-bold">{coachTrustData.goodEmotion}%</span>
                  </motion.div>
                </div>
              </div>
              
              {/* Bad Emotion Bar */}
              <div className="flex flex-col items-center">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">😠</span>
                  <span className="text-white font-semibold">Bad Emotion</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center"
                    initial={{ width: 0 }}
                    animate={{ width: `${coachTrustData.badEmotion}%` }}
                    transition={{ duration: 1.5, delay: 0.7 }}
                  >
                    <span className="text-white text-sm font-bold">{coachTrustData.badEmotion}%</span>
                  </motion.div>
                </div>
              </div>
              </div>
             
              {/* Satisfaction Level */}
            <div className="mt-6 text-center">
              <p className="text-gray-300 text-sm mb-2">Satisfaction Level</p>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-3xl">⭐</span>
                <span className="text-2xl font-bold text-orange-300">
                  {coachTrustData.satisfaction}%
                </span>
              </div>
            </div>
          </motion.div>          {/* Fixtures Box - 1/4 width */}
          <motion.div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl w-80 max-md:w-full flex-shrink-0"
            variants={itemVariants}
          >
            <Link href="/gamePage/fixtures">
              <div className="cursor-pointer hover:bg-white/5 rounded-xl p-2 -m-2 transition-all group">
                <h3 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center group-hover:text-orange-300 transition-colors">
                  📅 <span className="ml-2">Upcoming Fixtures</span>
                </h3>
                  <div className="space-y-3">
                  {fixtures.length > 0 ? (
                    fixtures.map((fixture, index) => (
                      <motion.div
                        key={fixture.id}
                        className="bg-white/5 rounded-lg p-3 border border-white/10 group-hover:bg-white/10 transition-all"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-purple-400 font-bold text-sm">💫</span>
                            <span className="text-white text-sm font-medium">Imagine</span>
                          </div>
                          <span className="text-white/60 text-xs">VS</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{fixture.opponentLogo}</span>
                            <span className="text-white text-sm font-medium">{fixture.opponent}</span>
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <span className="text-gray-400 text-xs">{fixture.date}</span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      className="bg-white/5 rounded-lg p-4 border border-white/10 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                    >
                      <div className="text-4xl mb-2">🏀</div>
                      <div className="text-white/70 text-sm">Loading schedule...</div>
                      <div className="text-gray-400 text-xs mt-1">Setting up your league</div>
                    </motion.div>
                  )}
                </div>                <div className="mt-4 text-center">
                  <motion.button
                    className="text-orange-400 hover:text-orange-300 text-sm underline transition-colors group-hover:text-orange-200"
                    whileHover={{ scale: 1.05 }}
                  >
                    {fixtures.length > 0 ? 'View Full Schedule' : 'View Schedule Setup'}
                  </motion.button>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default MainMenu;