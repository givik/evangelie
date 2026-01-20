'use client';

import { useState, useRef } from 'react';
import { saveTextAndTimings } from '@/app/actions/textActions';

export default function AdminTimingEditor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [timings, setTimings] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  
  const audioRef = useRef(null);

  // Prepare text for timing
  const handlePrepareText = () => {
    if (!content.trim()) {
      setMessage({ type: 'error', text: 'Please enter some text first!' });
      return;
    }

    const words = content.trim().split(/\s+/);
    const newTimings = words.map((word, index) => ({
      word,
      start_time: null,
      end_time: null,
      word_index: index,
    }));

    setTimings(newTimings);
    setMessage({ type: 'success', text: 'Text prepared! Click words to set timing.' });
  };

  // Auto-generate evenly distributed timings
  const handleAutoGenerate = () => {
    if (!audioRef.current || !audioRef.current.duration) {
      setMessage({ type: 'error', text: 'Please upload and load audio first!' });
      return;
    }

    if (timings.length === 0) {
      setMessage({ type: 'error', text: 'Please prepare text first!' });
      return;
    }

    const duration = audioRef.current.duration;
    const interval = duration / timings.length;

    const updatedTimings = timings.map((t, index) => ({
      ...t,
      start_time: parseFloat((interval * index).toFixed(2)),
      end_time: parseFloat((interval * (index + 1)).toFixed(2)),
    }));

    setTimings(updatedTimings);
    setMessage({ type: 'success', text: 'Timings auto-generated!' });
  };

  // Set timing from current audio position
  const handleWordClick = (index) => {
    if (!audioRef.current) {
      setMessage({ type: 'error', text: 'Please upload audio first!' });
      return;
    }

    const currentTime = parseFloat(audioRef.current.currentTime.toFixed(2));
    const updatedTimings = [...timings];
    updatedTimings[index].start_time = currentTime;
    
    // Set end time of previous word
    if (index > 0 && !updatedTimings[index - 1].end_time) {
      updatedTimings[index - 1].end_time = currentTime;
    }

    setTimings(updatedTimings);
  };

  // Handle audio file upload
  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      audioRef.current.src = url;
      setMessage({ type: 'success', text: 'Audio loaded!' });
    }
  };

  // Save to database
  const handleSave = async () => {
    if (!title || !content || !audioUrl) {
      setMessage({ type: 'error', text: 'Please fill in all fields!' });
      return;
    }

    if (timings.length === 0 || timings.some(t => t.start_time === null)) {
      setMessage({ type: 'error', text: 'Please set timings for all words!' });
      return;
    }

    setIsProcessing(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('audio_url', audioUrl);
    formData.append('timings', JSON.stringify(timings));

    const result = await saveTextAndTimings(formData);

    setIsProcessing(false);

    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: `Saved successfully! View at /texts/${result.textId}` 
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setAudioUrl('');
      setTimings([]);
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  // Export timings as JSON
  const handleExport = () => {
    const data = JSON.stringify({ title, content, audioUrl, timings }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'timings'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Admin - Create Text with Timings</h1>
        <p className="text-purple-100">Set up synchronized audio and text</p>
      </div>

      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h2 className="text-xl font-bold mb-4">1. Basic Information</h2>
        
        <div>
          <label className="block text-sm font-semibold mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter title..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Audio URL</label>
          <input
            type="text"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/audio.mp3"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Or Upload Audio File (for preview)</label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <audio ref={audioRef} controls className="w-full mt-4" />
      </div>

      {/* Text Input */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">2. Enter Text</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-32 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter the text that matches your audio..."
        />
        <button
          onClick={handlePrepareText}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Prepare Text
        </button>
      </div>

      {/* Timing Editor */}
      {timings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">3. Set Word Timings</h2>
            <div className="space-x-2">
              <button
                onClick={handleAutoGenerate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Auto-Generate
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Export JSON
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Play audio and click on each word at the right moment to set timing
          </p>

          <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {timings.map((timing, index) => (
                <button
                  key={index}
                  onClick={() => handleWordClick(index)}
                  className={`px-3 py-2 rounded-lg transition-all ${
                    timing.start_time !== null
                      ? 'bg-green-100 border-2 border-green-500'
                      : 'bg-gray-100 border-2 border-gray-300'
                  } hover:shadow-md`}
                >
                  <div className="font-semibold">{timing.word}</div>
                  <div className="text-xs text-gray-600">
                    {timing.start_time !== null ? `${timing.start_time}s` : 'Not set'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {timings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={handleSave}
            disabled={isProcessing}
            className={`w-full py-3 text-white text-lg font-bold rounded-lg ${
              isProcessing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
            }`}
          >
            {isProcessing ? 'Saving...' : 'Save to Database'}
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
        <h3 className="font-bold text-blue-900 mb-2">📋 Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Fill in title and audio URL</li>
          <li>Upload audio file for preview (optional)</li>
          <li>Enter or paste your text content</li>
          <li>Click "Prepare Text" to split into words</li>
          <li>Use "Auto-Generate" for quick even timing, or click each word while audio plays</li>
          <li>Click "Save to Database" when done</li>
        </ol>
      </div>
    </div>
  );
}
