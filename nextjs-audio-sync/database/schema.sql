-- Database Schema for Audio Text Synchronization
-- Run this SQL in your PostgreSQL database

-- Create texts table
CREATE TABLE IF NOT EXISTS texts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  audio_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create word_timings table
CREATE TABLE IF NOT EXISTS word_timings (
  id SERIAL PRIMARY KEY,
  text_id INTEGER REFERENCES texts(id) ON DELETE CASCADE,
  word VARCHAR(255) NOT NULL,
  start_time DECIMAL(10, 2) NOT NULL,
  end_time DECIMAL(10, 2),
  word_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_word_timings_text_id ON word_timings(text_id);
CREATE INDEX IF NOT EXISTS idx_word_timings_start_time ON word_timings(text_id, start_time);

-- Sample data (optional - for testing)
INSERT INTO texts (title, content, audio_url) VALUES 
(
  'Sample Text',
  'Hello world this is a test of the audio synchronization feature',
  'https://example.com/sample-audio.mp3'
);

-- Sample word timings (for text_id = 1)
-- Adjust these based on your actual audio
INSERT INTO word_timings (text_id, word, start_time, end_time, word_index) VALUES
(1, 'Hello', 0.0, 0.5, 0),
(1, 'world', 0.5, 1.0, 1),
(1, 'this', 1.0, 1.3, 2),
(1, 'is', 1.3, 1.5, 3),
(1, 'a', 1.5, 1.7, 4),
(1, 'test', 1.7, 2.0, 5),
(1, 'of', 2.0, 2.2, 6),
(1, 'the', 2.2, 2.4, 7),
(1, 'audio', 2.4, 2.8, 8),
(1, 'synchronization', 2.8, 3.5, 9),
(1, 'feature', 3.5, 4.0, 10);
