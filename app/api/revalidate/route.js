import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

// api/revalidate?tag=all-books&secret=YOUR_SECRET

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const secret = searchParams.get('secret');

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  if (!tag) {
    return NextResponse.json({ message: 'Missing tag' }, { status: 400 });
  }

  // New Signature: { expire: 0 } forces the cache to purge immediately
  // instead of waiting for a background refresh.
  revalidateTag(tag, { expire: 0 });

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
