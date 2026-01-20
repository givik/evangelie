import { Pool } from 'pg';
import AudioTextSync from '@/app/components/AudioTextSync';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Server Component - fetches data on server
async function getTextData(id) {
  try {
    // Fetch text and timings from database
    const textResult = await pool.query(
      'SELECT * FROM texts WHERE id = $1',
      [id]
    );

    if (textResult.rows.length === 0) {
      return null;
    }

    const timingsResult = await pool.query(
      'SELECT word, start_time, end_time, word_index FROM word_timings WHERE text_id = $1 ORDER BY word_index ASC',
      [id]
    );

    return {
      text: textResult.rows[0],
      timings: timingsResult.rows,
    };
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

export default async function TextPage({ params }) {
  const data = await getTextData(params.id);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">Text not found or database error</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <AudioTextSync 
        textData={data.text} 
        timings={data.timings} 
      />
    </div>
  );
}

// Optional: Generate metadata for SEO
export async function generateMetadata({ params }) {
  const data = await getTextData(params.id);
  
  if (!data) {
    return {
      title: 'Text Not Found',
    };
  }

  return {
    title: data.text.title,
    description: `Listen and read: ${data.text.title}`,
  };
}
