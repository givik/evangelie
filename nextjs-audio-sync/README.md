# Next.js Audio Text Synchronization App

A Next.js application that synchronizes audio playback with text highlighting, storing data in PostgreSQL.

## Features

- ✅ Real-time word highlighting synchronized with audio
- ✅ Auto-scroll to current word
- ✅ Click on words to jump to that part of audio
- ✅ Server Components for data fetching (no API routes)
- ✅ PostgreSQL database for text and timing storage
- ✅ Admin panel to create and manage timings
- ✅ Export/Import timings as JSON
- ✅ Auto-generate evenly distributed timings

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## Installation

### 1. Clone or create the project

```bash
mkdir nextjs-audio-sync
cd nextjs-audio-sync
```

### 2. Install dependencies

```bash
npm install next@latest react@latest react-dom@latest pg
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Set up PostgreSQL database

Create a database and run the schema:

```bash
psql -U your_username -d your_database -f database/schema.sql
```

Or manually run the SQL commands in `database/schema.sql`

### 4. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your database connection string:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
```

### 5. Configure Tailwind CSS

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Create `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Update `app/layout.js`:

```javascript
import './globals.css'

export const metadata = {
  title: 'Audio Text Sync',
  description: 'Synchronized audio and text highlighting',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

## Project Structure

```
nextjs-audio-sync/
├── app/
│   ├── actions/
│   │   └── textActions.js          # Server Actions for mutations
│   ├── admin/
│   │   └── page.js                 # Admin panel page
│   ├── components/
│   │   ├── AudioTextSync.js        # Client component for playback
│   │   └── AdminTimingEditor.js    # Admin editor component
│   ├── texts/
│   │   └── [id]/
│   │       └── page.js             # Text display page (Server Component)
│   ├── layout.js
│   └── globals.css
├── lib/
│   └── db.js                       # Database utilities
├── database/
│   └── schema.sql                  # Database schema
├── .env.example
├── .env.local                      # Your actual env vars (gitignored)
├── package.json
└── README.md
```

## Usage

### 1. Start the development server

```bash
npm run dev
```

### 2. Create text with timings

Go to `http://localhost:3000/admin`

1. Enter title and audio URL
2. Optionally upload audio file for preview
3. Enter or paste your text
4. Click "Prepare Text"
5. Use "Auto-Generate" or click each word while audio plays
6. Click "Save to Database"

### 3. View synchronized text

After saving, you'll get a link like `/texts/1`

Visit `http://localhost:3000/texts/1` to see your synchronized text with audio

## Database Schema

### `texts` table
- `id` - Primary key
- `title` - Text title
- `content` - Full text content
- `audio_url` - URL to audio file
- `created_at` - Timestamp
- `updated_at` - Timestamp

### `word_timings` table
- `id` - Primary key
- `text_id` - Foreign key to texts
- `word` - Individual word
- `start_time` - When word starts (seconds)
- `end_time` - When word ends (optional)
- `word_index` - Position in text
- `created_at` - Timestamp

## How It Works

### Server Components (No API Routes!)

Instead of API routes, we use:

1. **Server Components** - Fetch data directly in page components
2. **Server Actions** - Handle mutations (create, update, delete)

Example:

```javascript
// app/texts/[id]/page.js
import { getTextWithTimings } from '@/lib/db';

export default async function TextPage({ params }) {
  const data = await getTextWithTimings(params.id); // Direct DB query!
  return <AudioTextSync textData={data.text} timings={data.timings} />;
}
```

### Real-time Synchronization

The `AudioTextSync` component:

1. Listens to audio `timeupdate` events
2. Finds the current word based on timestamp
3. Highlights and scrolls to that word
4. Allows clicking words to seek audio

## Advanced Features

### Auto-generate timings

Uses the audio duration divided by word count:

```javascript
const interval = duration / wordCount;
timings[i].start_time = interval * i;
```

### Manual timing setting

Click words while audio plays to capture exact timestamps.

### Export/Import JSON

Save and load timing configurations for backup or sharing.

## Deployment

### Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Import project in Vercel
3. Add `DATABASE_URL` environment variable
4. Deploy!

### Database Options

- **Vercel Postgres** - Built-in PostgreSQL
- **Supabase** - Free PostgreSQL hosting
- **Railway** - Easy PostgreSQL deployment
- **AWS RDS** - Production-grade PostgreSQL

## Performance Tips

1. **Enable ISR** - Add `export const revalidate = 60` in pages
2. **Database Indexing** - Already included in schema
3. **Connection Pooling** - Configured in `lib/db.js`
4. **Lazy Loading** - Audio only loads when needed

## Troubleshooting

### Database connection fails
- Check `DATABASE_URL` in `.env.local`
- Ensure PostgreSQL is running
- Verify credentials and database exists

### Audio doesn't play
- Check audio URL is accessible
- Ensure CORS allows your domain
- Try different audio formats (MP3, WAV)

### Timings not saving
- Check browser console for errors
- Verify Server Actions are enabled in Next.js config
- Ensure database has write permissions

## Future Enhancements

- [ ] Speech-to-text auto-timing generation
- [ ] Multiple language support
- [ ] Waveform visualization
- [ ] Playback speed control
- [ ] Mobile app version
- [ ] Collaborative editing

## License

MIT

## Contributing

Pull requests welcome! Please read CONTRIBUTING.md first.
