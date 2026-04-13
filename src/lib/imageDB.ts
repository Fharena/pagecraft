/**
 * IndexedDB를 이용한 이미지 저장소
 * sessionStorage는 5MB 제한이 있어서 base64 이미지 저장 시 초과됨
 * IndexedDB는 용량 제한이 사실상 없음 (디스크 용량의 ~50%)
 */
import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'pagecraft-images'
const STORE_NAME = 'images'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      },
    })
  }
  return dbPromise
}

export async function saveImagesToDB(images: { id: string; dataUrl: string; bgRemoved: boolean; order: number }[]) {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  await store.put(images, 'product-images')
  await tx.done
}

export async function loadImagesFromDB(): Promise<{ id: string; dataUrl: string; bgRemoved: boolean; order: number }[]> {
  const db = await getDB()
  const result = await db.get(STORE_NAME, 'product-images')
  return result || []
}

export async function clearImagesFromDB() {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  await tx.objectStore(STORE_NAME).delete('product-images')
  await tx.done
}
