import { getTextWithTimings } from '@/lib/db';
import AudioTextSync from '@/app/components/AudioTextSync';

// Server Component - fetches data on server
export default async function TextPage({ params }) {
  const data = await getTextWithTimings(params.id);

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
  const data = await getTextWithTimings(params.id);
  
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

// Optional: Enable ISR (Incremental Static Regeneration)
// This will cache the page and regenerate it every 60 seconds
export const revalidate = 60;
