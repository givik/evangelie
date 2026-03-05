import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request) {
  const fontPath = join(process.cwd(), 'app/fonts/bpg_nino_elite_round.otf');

  const fontData = await readFile(fontPath);

  const { searchParams } = request.nextUrl;

  const verse = searchParams.get('verse') ?? 'ბიბლია';
  const book = searchParams.get('book') ?? '';

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f6f1e2',
        fontFamily: 'GeoFont',
        padding: '60px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '40px',
        }}
      >
        <h1
          style={{
            fontSize: book ? '48px' : '64px',
            fontWeight: 700,
            color: '#333',
            textAlign: 'center',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {verse}
        </h1>
        <p
          style={{
            fontSize: '64px',
            color: '#333',
            textAlign: 'center',
            margin: 0,
          }}
        >
          ბიბლია განმარტებებით
        </p>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '48px',
          color: '#333',
        }}
      >
        {book}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'GeoFont',
          data: fontData,
          style: 'normal',
        },
      ],
    },
  );
}
