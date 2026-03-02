const DB_NAME = 'bible-db';
const DB_VERSION = 3; // Incremented to add commentaries index

export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const transaction = event.target.transaction;

      if (!db.objectStoreNames.contains('verses')) {
        const verseStore = db.createObjectStore('verses', { keyPath: 'id' });
        verseStore.createIndex('by_book_chapter', ['წიგნი', 'თავი'], { unique: false });
      } else {
        const verseStore = transaction.objectStore('verses');
        if (!verseStore.indexNames.contains('by_book_chapter')) {
          verseStore.createIndex('by_book_chapter', ['წიგნი', 'თავი'], { unique: false });
        }
      }

      if (!db.objectStoreNames.contains('commentaries')) {
        const commentaryStore = db.createObjectStore('commentaries', { keyPath: 'id' });
        commentaryStore.createIndex('by_mukhli_id', 'mukhli_id', { unique: false });
      } else {
        const commentaryStore = transaction.objectStore('commentaries');
        if (!commentaryStore.indexNames.contains('by_mukhli_id')) {
          commentaryStore.createIndex('by_mukhli_id', 'mukhli_id', { unique: false });
        }
      }

      if (!db.objectStoreNames.contains('themes')) {
        const themeStore = db.createObjectStore('themes', { keyPath: 'id' });
        themeStore.createIndex('by_book', 'წიგნი', { unique: false });
      } else {
        const themeStore = transaction.objectStore('themes');
        if (!themeStore.indexNames.contains('by_book')) {
          themeStore.createIndex('by_book', 'წიგნი', { unique: false });
        }
      }

      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveToStore = async (storeName, data) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    data.forEach((item) => {
      store.put(item);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getFromStore = async (storeName, id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllFromStore = async (storeName) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const isSynced = async () => {
  try {
    const metadata = await getFromStore('metadata', 'sync-status');
    return metadata && metadata.completed;
  } catch (e) {
    return false;
  }
};

export const setSynced = async (completed) => {
  await saveToStore('metadata', [{ id: 'sync-status', completed, timestamp: Date.now() }]);
};

// --- Query functions that mirror server actions ---

export const getVersesFromDB = async (book, chapter) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('verses', 'readonly');
    const store = transaction.objectStore('verses');
    const index = store.index('by_book_chapter');
    const request = index.getAll(IDBKeyRange.only([book, parseInt(chapter)]));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getBooksFromDB = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('verses', 'readonly');
    const store = transaction.objectStore('verses');
    const request = store.openCursor(null, 'next');
    const books = new Set();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        books.add(cursor.value.წიგნი);
        cursor.continue();
      } else {
        // Return in same format as server action: [{ წიგნი: "..." }, ...]
        resolve(
          Array.from(books)
            .sort()
            .map((b) => ({ წიგნი: b })),
        );
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const getChaptersFromDB = async (book) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('verses', 'readonly');
    const store = transaction.objectStore('verses');
    const index = store.index('by_book_chapter');

    // Use a key range that covers all chapters for this book
    const range = IDBKeyRange.bound([book], [book, []], false, false);
    const request = index.openCursor(range, 'next');
    const chapters = new Set();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        chapters.add(cursor.value.თავი);
        cursor.continue();
      } else {
        // Return in same format as server action: [{ თავი: 1 }, { თავი: 2 }, ...]
        resolve(
          Array.from(chapters)
            .sort((a, b) => a - b)
            .map((ch) => ({ თავი: ch })),
        );
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const getCommentaryFromDB = async (verseId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('commentaries', 'readonly');
    const store = transaction.objectStore('commentaries');
    const index = store.index('by_mukhli_id');
    const id = parseInt(verseId, 10);
    if (isNaN(id)) {
      resolve([]);
      return;
    }
    const request = index.getAll(IDBKeyRange.only(id));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getVerseIDFromDB = async (book, chapter, verse) => {
  const chapterInt = parseInt(chapter, 10);
  const verseInt = parseInt(verse, 10);
  if (isNaN(chapterInt) || isNaN(verseInt)) return null;

  const verses = await getVersesFromDB(book, chapterInt);
  const found = verses.find((v) => v.მუხლი === verseInt);
  return found?.id || null;
};

export const getThemesFromDB = async (book) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('themes', 'readonly');
    const store = transaction.objectStore('themes');
    const index = store.index('by_book');
    const request = index.getAll(IDBKeyRange.only(book));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const searchBibleInDB = async (queryText) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('verses', 'readonly');
    const store = transaction.objectStore('verses');
    const request = store.openCursor();
    const results = [];
    const lowerQuery = queryText.toLowerCase();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.ტექსტი.toLowerCase().includes(lowerQuery)) {
          results.push(cursor.value);
        }
        if (results.length < 50) {
          cursor.continue();
        } else {
          resolve(results);
        }
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
};
