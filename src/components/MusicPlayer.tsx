"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  genre: string;
}

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.3); // Lower default volume
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playRequestRef = useRef<Promise<void> | null>(null);

  const musicTracks: MusicTrack[] = [
    {
      id: '1',
      title: 'I Want to Hold Your Hand',
      artist: 'The Beatles',
      url: '/music/IWantToHoldYourHand.mp3',
      genre: 'Energetic'
    },
    {
      id: '2',
      title: 'Come Together',
      artist: 'The Beatles',
      url: '/music/ComeTogether.mp3', // Place your music files in public/music/
      genre: 'Triumphant'
    },

    {
      id: '3',
      title: 'Misty',
      artist: 'Ella Fitzgerald',
      url: '/music/Misty.mp3', // Place your music files in public/music/
      genre: 'Relaxed'
    },
    
  ];
  // Initialize music on component mount
  useEffect(() => {
    if (!isInitialized && musicTracks.length > 0) {
      setCurrentTrack(musicTracks[0]);
      setCurrentTrackIndex(0);
      setIsInitialized(true);
      
      // Auto-play after a short delay to allow user interaction
      setTimeout(() => {
        if (audioRef.current) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
              })
              .catch((error) => {
                console.log('Auto-play was prevented:', error);
                // Auto-play was prevented, user needs to interact first
              });
          }
        }
      }, 2000); // 2 second delay
    }
  }, [isInitialized, musicTracks]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);  useEffect(() => {
    if (currentTrack && audioRef.current) {
      setIsLoading(true);
      setHasError(false);
      const audio = audioRef.current;
      
      // Cancel any previous play request
      if (playRequestRef.current) {
        audio.pause();
        playRequestRef.current = null;
      }
      
      audio.src = currentTrack.url;
      
      const handleCanPlay = () => {
        setIsLoading(false);
        if (isPlaying) {
          // Store the play promise to prevent conflicts
          playRequestRef.current = audio.play().catch((error) => {
            console.error('Play error:', error);
            setHasError(true);
            setIsPlaying(false);
            playRequestRef.current = null;
          });
        }
      };
    
      const handleError = () => {
        setIsLoading(false);
        setHasError(true);
        setIsPlaying(false);
      };
      
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);
      
      return () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [currentTrack, isPlaying]);
  const togglePlay = async () => {
    if (!currentTrack && musicTracks.length > 0) {
      setCurrentTrack(musicTracks[0]);
      return;
    }
    
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
          if (playRequestRef.current) {
            playRequestRef.current = null;
          }
          setIsPlaying(false);
        } else {
          // Cancel any previous play request
          if (playRequestRef.current) {
            audioRef.current.pause();
          }
          
          playRequestRef.current = audioRef.current.play();
          await playRequestRef.current;
          setIsPlaying(true);
          playRequestRef.current = null;
        }
      } catch (error) {
        console.error('Toggle play error:', error);
        setHasError(true);
        setIsPlaying(false);
        playRequestRef.current = null;
      }
    }
  };  const selectTrack = async (track: MusicTrack) => {
    // Stop current playback
    if (audioRef.current && playRequestRef.current) {
      audioRef.current.pause();
      playRequestRef.current = null;
    }
    
    setIsPlaying(false);
    setCurrentTrack(track);
    setCurrentTrackIndex(musicTracks.findIndex(t => t.id === track.id));
    setShowMusicMenu(false);
    setHasError(false);
    
    // Auto-start new track if there was music playing
    if (isPlaying || !isInitialized) {
      setTimeout(() => setIsPlaying(true), 100);
    }
  };
  const nextTrack = () => {
    // Stop current playback
    if (audioRef.current && playRequestRef.current) {
      audioRef.current.pause();
      playRequestRef.current = null;
    }
    
    const nextIndex = (currentTrackIndex + 1) % musicTracks.length;
    setCurrentTrackIndex(nextIndex);
    setCurrentTrack(musicTracks[nextIndex]);
    setHasError(false);
  };

  const previousTrack = () => {
    // Stop current playback
    if (audioRef.current && playRequestRef.current) {
      audioRef.current.pause();
      playRequestRef.current = null;
    }
    
    const prevIndex = currentTrackIndex === 0 ? musicTracks.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setCurrentTrack(musicTracks[prevIndex]);
    setHasError(false);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
    }
  };

  return (
    <>      <audio
        ref={audioRef}
        loop={false}
        onEnded={() => {
          setIsPlaying(false);
          playRequestRef.current = null;
          
          // Auto-play next track after a short delay
          setTimeout(() => {
            nextTrack();
            setTimeout(() => {
              setIsPlaying(true);
            }, 200);
          }, 500);
        }}
        onError={(e) => {
          console.error('Audio error:', e);
          setHasError(true);
          setIsLoading(false);
          setIsPlaying(false);
          playRequestRef.current = null;
        }}
      />

      {/* Music Control Button */}
      <motion.div 
        className="fixed top-6 right-6 z-50"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
      >        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-xl">
          <div className="flex items-center space-x-2">
            {/* Previous Button */}
            <motion.button
              onClick={previousTrack}
              className="bg-white/20 text-white p-2 rounded-lg hover:bg-white/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!currentTrack}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </motion.button>

            {/* Play/Pause Button */}
            <motion.button
              onClick={togglePlay}
              className="bg-gradient-to-r from-orange-400 to-red-500 text-white p-3 rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading || hasError}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : hasError ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              ) : isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </motion.button>

            {/* Next Button */}
            <motion.button
              onClick={nextTrack}
              className="bg-white/20 text-white p-2 rounded-lg hover:bg-white/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!currentTrack}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </motion.button>

            {/* Music Selection Button */}
            <motion.button
              onClick={() => setShowMusicMenu(!showMusicMenu)}
              className="bg-white/20 text-white p-3 rounded-xl hover:bg-white/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </motion.button>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                </svg>
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>          {/* Current Track Info */}
          {currentTrack && (
            <motion.div 
              className="mt-3 pt-3 border-t border-white/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-white text-sm font-semibold">{currentTrack.title}</p>
              <p className="text-white/70 text-xs">{currentTrack.artist}</p>
              {hasError && (
                <p className="text-red-400 text-xs mt-1">⚠️ Failed to load audio</p>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Music Selection Menu */}
      <AnimatePresence>
        {showMusicMenu && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMusicMenu(false)}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl max-w-md w-full max-h-[70vh] overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">🎵 Choose Music</h3>
                <button
                  onClick={() => setShowMusicMenu(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {musicTracks.map((track) => (
                  <motion.button
                    key={track.id}
                    onClick={() => selectTrack(track)}
                    className={`w-full p-4 rounded-xl border transition-all text-left ${
                      currentTrack?.id === track.id
                        ? 'bg-orange-500/20 border-orange-400 text-white'
                        : 'bg-white/5 border-white/20 text-white/90 hover:bg-white/10 hover:border-white/30'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{track.title}</h4>
                        <p className="text-sm text-white/70">{track.artist}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                          {track.genre}
                        </span>
                        {currentTrack?.id === track.id && (
                          <div className="mt-1">
                            <span className="text-orange-400 text-xs">♪ Playing</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/20">
                <p className="text-white/60 text-xs text-center">
                  💡 Tip: Add your own music files to the public/music folder
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom CSS for slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: linear-gradient(45deg, #f97316, #ef4444);
          border-radius: 50%;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: linear-gradient(45deg, #f97316, #ef4444);
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </>
  );
};

export default MusicPlayer;
