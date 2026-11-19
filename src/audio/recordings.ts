import { clear, createStore, del, delMany, set, values, type UseStore } from 'idb-keyval'
import type { Recording, VerseKey } from '../core/types'

export const KEEP = 5
let s: UseStore | undefined
const store = () => (s ??= createStore('tajweed-path-recordings', 'recordings')) // lazy: no IndexedDB at import

/** All recordings, newest first (Settings sums `blob.size` for storage used). */
export async function listAll(): Promise<Recording[]> {
  return (await values<Recording>(store())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function list(from: VerseKey, to: VerseKey): Promise<Recording[]> {
  return (await listAll()).filter(r => r.from === from && r.to === to)
}

/** Saves and keeps only the newest KEEP for the same range. */
export async function save(rec: Recording): Promise<void> {
  await set(rec.id, rec, store())
  const old = (await list(rec.from, rec.to)).slice(KEEP)
  if (old.length) await delMany(old.map(r => r.id), store())
}

export const remove = (id: string) => del(id, store())
export const removeAll = () => clear(store())
