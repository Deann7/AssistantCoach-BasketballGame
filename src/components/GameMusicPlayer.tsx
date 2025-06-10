"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Music, Volume2, VolumeX } from 'lucide-react';

interface MusicTrack {
  title: string;
  url: string;
}

const GameMusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.2); // Lower volume for game
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Different tracks for game mode
  const tracks: MusicTrack[] = [
    { title: 'Arena Intensity', url: '/music/BasketballAudio.mp3' },

  ];

  // Initialize and auto-play
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio(tracks[0].url);
      audioRef.current.volume = volume;
      audioRef.current.loop = false;

      // Auto-play
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            console.log('Auto-play blocked');
            setIsPlaying(false);
          });
      }

      // Handle track end
      audioRef.current.addEventListener('ended', () => {
        const nextIndex = (currentTrackIndex + 1) % tracks.length;
        setCurrentTrackIndex(nextIndex);
        if (audioRef.current) {
          audioRef.current.src = tracks[nextIndex].url;
          audioRef.current.play().then(() => setIsPlaying(true));
        }
      });
    }    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-black/80 backdrop-blur-sm rounded-full p-3 flex items-center space-x-3 shadow-lg">
        <button 
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition-colors"
        >
          {isPlaying ? (
            <div className="w-3 h-3 flex space-x-1">
              <div className="w-1 h-3 bg-white"></div>
              <div className="w-1 h-3 bg-white"></div>
            </div>
          ) : (
            <Music className="w-5 h-5" />
          )}
        </button>
        
        <div className="flex items-center space-x-2">
          <button onClick={toggleMute} className="text-white hover:text-blue-400">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div className="text-white text-xs max-w-32 truncate">
          {tracks[currentTrackIndex].title}
        </div>
      </div>
    </div>
  );
};

export default GameMusicPlayer;