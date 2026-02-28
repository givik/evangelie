const DB_NAME = 'bible-db';
const DB_VERSION = 2; // Incremented version to add indexes

export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('verses')) {
        const verseStore = db.createObjectStore('verses', { keyPath: 'id' });
        verseStore.createIndex('by_book_chapter', ['წიგნი', 'თავი'], { unique: false });
      } else {
        const transaction = event.target.transaction;
        const verseStore = transaction.objectStore('verses');
        if (!verseStore.indexNames.contains('by_book_chapter')) {
          verseStore.createIndex('by_book_chapter', ['წიგნი', 'თავი'], { unique: false });
        }
      }

      if (!db.objectStoreNames.contains('commentaries')) {
        db.createObjectStore('commentaries', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('themes')) {
        const themeStore = db.createObjectStore('themes', { keyPath: 'id' });
        themeStore.createIndex('by_book', 'წიგნი', { unique: false });
      } else {
        const transaction = event.target.transaction;
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
