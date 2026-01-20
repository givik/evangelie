'use client';

import { useState, useEffect, useRef } from 'react';

export default function AudioTextSync({ textData, timings }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef(null);
  const wordsContainerRef = useRef(null);

  // Handle audio time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;

      // Find current word index based on timing
      let newIndex = -1;
      for (let i = timings.length - 1; i >= 0; i--) {
        if (currentTime >= timings[i].start_time) {
          newIndex = i;
          break;
        }
      }

      if (newIndex !== currentWordIndex) {
        setCurrentWordIndex(newIndex);
        scrollToWord(newIndex);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentWordIndex(-1);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [timings, currentWordIndex]);

  // Scroll to highlighted word
  const scrollToWord = (index) => {
    if (index < 0) return;

    const wordElement = document.querySelector(`[data-word-index="${index}"]`);
    if (wordElement && wordsContainerRef.current) {
      wordElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  };

  // Click on word to seek audio
  const handleWordClick = (index) => {
    if (audioRef.current && timings[index]) {
      audioRef.current.currentTime = timings[index].start_time;
      audioRef.current.play();
    }
  };

  // Render words with highlighting
  const renderWords = () => {
    if (timings.length === 0) {
      return <p className="text-gray-500">{textData.content}</p>;
    }

    return timings.map((timing, index) => (
      <span
        key={index}
        data-word-index={index}
        onClick={() => handleWordClick(index)}
        className={`inline-block px-1 py-0.5 mx-0.5 rounded transition-all duration-300 cursor-pointer ${
          currentWordIndex === index
            ? 'bg-yellow-300 font-semibold scale-105 shadow-md'
            : 'hover:bg-gray-100'
        }`}
      >
        {timing.word}
      </span>
    ));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-2">{textData.title}</h1>
        <p className="text-blue-100">Listen and follow along</p>
      </div>

      {/* Audio Player */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <audio
          ref={audioRef}
          src={textData.audio_url}
          controls
          className="w-full"
        >
          Your browser does not support the audio element.
        </audio>
        
        <div className="mt-4 flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isPlaying ? 'Playing...' : 'Paused'}
          </span>
          {currentWordIndex >= 0 && (
            <span className="text-sm text-gray-500">
              Word {currentWordIndex + 1} of {timings.length}
            </span>
          )}
        </div>
      </div>

      {/* Text Display */}
      <div 
        ref={wordsContainerRef}
        className="bg-white rounded-lg shadow-md p-8 min-h-[400px] max-h-[600px] overflow-y-auto"
      >
        <div className="text-xl leading-relaxed">
          {renderWords()}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Click on any word to jump to that part of the audio!
        </p>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 grid grid-cols-3 gap-4">
        <div>
          <p className="font-semibold">Total Words</p>
          <p className="text-2xl font-bold text-blue-600">{timings.length}</p>
        </div>
        <div>
          <p className="font-semibold">Current Word</p>
          <p className="text-2xl font-bold text-green-600">
            {currentWordIndex >= 0 ? currentWordIndex + 1 : '-'}
          </p>
        </div>
        <div>
          <p className="font-semibold">Status</p>
          <p className="text-2xl font-bold text-purple-600">
            {isPlaying ? '▶️' : '⏸️'}
          </p>
        </div>
      </div>
    </div>
  );
}
