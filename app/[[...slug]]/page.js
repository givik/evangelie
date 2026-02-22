import { getChapters, getThemes, getVerses } from '../actions';
import BibleReader from '@/components/BibleReader';
import { BOOKS } from '@/lib/constants';
import './page.css';

export async function generateMetadata({ params }) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return {
      title: 'სახარება',
    };
  }

  const shortBook = decodeURIComponent(slug[0]);
  const chapter = slug[1] || '1';

  const bookObj = BOOKS.find((b) => b.short === shortBook);
  const title = bookObj ? `${bookObj.name} - თავი ${chapter}` : 'სახარება';
  const description = bookObj
    ? `${bookObj.name}, თავი ${chapter}. წაიკითხეთ სახარება ონლაინ ქართულად.`
    : 'წაიკითხეთ სახარება ონლაინ ქართულად.';

  return {
    title,
    description,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'ბიბლია.გე',
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;

  let activeBookName = BOOKS[0].name; // Default: Matthew
  let activeChapter = '1';
  let isRoot = true;

  if (slug && slug.length > 0) {
    isRoot = false;
    const shortBook = decodeURIComponent(slug[0]);
    const bookObj = BOOKS.find((b) => b.short === shortBook);

    if (bookObj) {
      activeBookName = bookObj.name;
    }

    if (slug.length > 1) {
      activeChapter = slug[1];
    }
  }

  // Fetch data on the server
  // Parallel refetching
  const [chapters, themes, verses] = await Promise.all([
    getChapters(activeBookName),
    getThemes(activeBookName),
    getVerses(activeBookName, activeChapter),
  ]);

  return (
    <BibleReader
      activeBook={activeBookName}
      activeChapter={activeChapter}
      chapters={chapters}
      themes={themes}
      verses={verses}
      isRoot={isRoot}
    />
  );
}
