// Sync decisions against a fake Supabase (the real client is null in tests). Each test loads fresh modules.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserData } from '../core/types'

const db = vi.hoisted(() => ({
  row: null as null | { doc: any; updated_at: string },
  writes: [] as any[],
  insertError: null as null | { code: string; message: string },
  rpcs: [] as string[],
  auth: null as null | ((event: string, session: any) => void),
}))

vi.mock('./supabase', () => {
  const query = () => {
    const q: any = { op: 'select' }
    const b: any = {
      select: () => b, eq: () => b, maybeSingle: () => b,
      update: (v: any) => { q.op = 'update'; q.v = v; return b },
      insert: (v: any) => { q.op = 'insert'; q.v = v; return b },
      upsert: () => { q.op = 'upsert'; return b },
      then: (ok: any, bad: any) => Promise.resolve(exec(q)).then(ok, bad),
    }
    return b
  }
  const exec = (q: any) => {
    if (q.op === 'select') return { data: db.row && JSON.parse(JSON.stringify(db.row)), error: null }
    if (q.op === 'upsert') return { data: null, error: null }
    if (q.op === 'insert' && db.insertError) return { data: null, error: db.insertError }
    db.writes.push(q.v)
    db.row = { doc: JSON.parse(JSON.stringify(q.v.doc)), updated_at: q.v.updated_at }
    return { data: [{ user_id: 'x' }], error: null }
  }
  return {
    supabase: {
      from: query,
      rpc: async (fn: string) => { db.rpcs.push(fn); return { data: null, error: null } },
      auth: {
        onAuthStateChange: (fn: any) => { db.auth = fn },
        signOut: async () => db.auth?.('SIGNED_OUT', null),
      },
    },
    exchangeCodeFromUrl: async () => {},
  }
})

const ACCOUNT_KEY = 'tajweed-path:sync-account'

function withProgress(d: UserData, lesson = 'izhar'): UserData {
  return { ...d, introductions: [...d.introductions, { lessonId: lesson, on: '2026-11-15', at: '2026-11-15T08:00:00.000Z' }] }
}

async function boot(opts: { local?: (d: UserData) => UserData; remote?: (d: UserData) => any; last?: string } = {}) {
  vi.resetModules()
  localStorage.clear()
  const store0 = await import('../core/store')
  if (opts.local) localStorage.setItem(store0.STORAGE_KEY, JSON.stringify(opts.local(store0.defaultData())))
  if (opts.last) localStorage.setItem(ACCOUNT_KEY, opts.last)
  db.row = opts.remote ? { doc: opts.remote(store0.defaultData()), updated_at: '2026-11-01T00:00:00.000Z' } : null
  db.writes = []; db.insertError = null; db.rpcs = []
  vi.resetModules()
  const store = await import('../core/store')
  const sync = await import('./sync')
  await sync.startSync()
  db.auth!('SIGNED_IN', { user: { id: 'u1', email: 'a@x' } })
  await sync.syncNow()
  await new Promise(r => setTimeout(r, 0)) // the auth callback's own sync, so it cannot spill into the next test
  await sync.syncNow()
  return { store, sync }
}

const remoteDoc = (d: UserData) => ({
  ...withProgress(d, 'idgham'),
  settings: { ...d.settings, onboardedOn: '2026-10-01', teacherName: 'Sh. Remote', updatedAt: '2026-10-01T00:00:00.000Z' },
})

describe('first sync of an account on this device', () => {
  beforeEach(() => vi.useRealTimers())

  it('fresh device (onboarded just now, no progress): takes the account copy as is, settings included', async () => {
    const { store, sync } = await boot({ local: d => ({ ...d, settings: { ...d.settings, onboardedOn: '2026-11-20', wirdTime: '09:00' } }), remote: remoteDoc })
    const d = store.getSnapshot()
    expect(d.settings.teacherName).toBe('Sh. Remote')
    expect(d.settings.onboardedOn).toBe('2026-10-01')
    expect(d.introductions.map(i => i.lessonId)).toEqual(['idgham'])
    expect(sync.getSyncState().status).toBe('synced')
    expect(localStorage.getItem(ACCOUNT_KEY)).toBe('u1')
  })

  it('device with progress, never synced: merges rows but keeps the account settings', async () => {
    const { store } = await boot({ local: d => withProgress({ ...d, settings: { ...d.settings, onboardedOn: '2026-11-20' } }), remote: remoteDoc })
    const d = store.getSnapshot()
    expect(d.introductions.map(i => i.lessonId).sort()).toEqual(['idgham', 'izhar'])
    expect(d.settings.teacherName).toBe('Sh. Remote')
    expect(db.writes.at(-1).doc.introductions).toHaveLength(2)
  })

  it('a different account synced here before: pauses and writes nothing until the learner chooses', async () => {
    const { store, sync } = await boot({ local: d => withProgress(d), remote: remoteDoc, last: 'someone-else' })
    expect(sync.getSyncState().status).toBe('choose')
    expect(db.writes).toHaveLength(0)
    expect(store.getSnapshot().introductions.map(i => i.lessonId)).toEqual(['izhar'])
    await sync.syncNow() // stays paused
    expect(db.writes).toHaveLength(0)
    await sync.chooseAccountData('replace')
    expect(store.getSnapshot().introductions.map(i => i.lessonId)).toEqual(['idgham'])
    expect(sync.getSyncState().status).toBe('synced')
    expect(localStorage.getItem(ACCOUNT_KEY)).toBe('u1')
  })

  it('account switch, "merge": both progresses end up in the account', async () => {
    const { store, sync } = await boot({ local: d => withProgress(d), remote: remoteDoc, last: 'someone-else' })
    await sync.chooseAccountData('merge')
    expect(store.getSnapshot().introductions.map(i => i.lessonId).sort()).toEqual(['idgham', 'izhar'])
    expect(db.row!.doc.introductions).toHaveLength(2)
  })

  it('account switch, cancel: signs out, nothing written', async () => {
    const { sync } = await boot({ local: d => withProgress(d), remote: remoteDoc, last: 'someone-else' })
    await sync.signOut()
    expect(sync.getSyncState().user).toBeNull()
    expect(db.writes).toHaveLength(0)
  })

  it('remote on a newer schema: local kept, nothing written, error shown', async () => {
    const { store, sync } = await boot({ local: d => withProgress(d), remote: d => ({ ...remoteDoc(d), schemaVersion: 99 }), last: 'u1' })
    expect(sync.getSyncState().status).toBe('error')
    expect(sync.getSyncState().error).toMatch(/newer version/)
    expect(store.getSnapshot().introductions.map(i => i.lessonId)).toEqual(['izhar'])
    expect(db.writes).toHaveLength(0)
  })

  it('remote failing validation on a fresh device: nothing replaced, nothing written', async () => {
    const { store, sync } = await boot({ remote: d => ({ ...d, introductions: 'broken' }) })
    expect(sync.getSyncState().status).toBe('error')
    expect(store.getSnapshot().introductions).toEqual([])
    expect(db.writes).toHaveLength(0)
  })

  it('syncing again changes nothing (merge is idempotent through the whole loop)', async () => {
    const { sync } = await boot({ local: d => withProgress(d), remote: remoteDoc, last: 'u1' })
    const n = db.writes.length
    await sync.syncNow()
    expect(db.writes.length).toBe(n)
  })
})

describe('reset, restore and delete while signed in', () => {
  it('reset signs out and forgets the account: the next sign-in takes the account copy', async () => {
    const { store, sync } = await boot({ local: d => withProgress({ ...d, settings: { ...d.settings, onboardedOn: '2026-11-02' } }), remote: remoteDoc, last: 'u1' })
    await sync.resetThisDevice()
    expect(sync.getSyncState().user).toBeNull()
    expect(localStorage.getItem(ACCOUNT_KEY)).toBeNull()
    expect(store.getSnapshot().introductions).toEqual([])
    db.auth!('SIGNED_IN', { user: { id: 'u1' } })
    await sync.syncNow()
    expect(store.getSnapshot().settings.onboardedOn).toBe('2026-11-02')
    expect(store.getSnapshot().introductions.map(i => i.lessonId).sort()).toEqual(['idgham', 'izhar'])
  })

  it('restore replaces the account copy instead of merging with it', async () => {
    const { store, sync } = await boot({ local: d => withProgress(d), remote: remoteDoc, last: 'u1' })
    const backup = withProgress(store.defaultData(), 'qalqala')
    sync.restoreBackup(JSON.stringify(backup))
    await sync.syncNow()
    expect(db.row!.doc.introductions.map((i: any) => i.lessonId)).toEqual(['qalqala'])
    expect(store.getSnapshot().introductions.map(i => i.lessonId)).toEqual(['qalqala'])
  })

  it('delete calls delete_me, signs out and forgets the account', async () => {
    const { sync } = await boot({ local: d => withProgress(d), remote: remoteDoc, last: 'u1' })
    await sync.deleteAccount()
    expect(db.rpcs).toEqual(['delete_me'])
    expect(sync.getSyncState().user).toBeNull()
    expect(localStorage.getItem(ACCOUNT_KEY)).toBeNull()
  })

  it('account deleted on another device (insert hits the missing auth user): signs out, no retry', async () => {
    vi.resetModules()
    db.insertError = { code: '23503', message: 'fk' }
    const { sync } = await bootWithInsertError()
    expect(sync.getSyncState().user).toBeNull()
    expect(sync.getSyncState().error).toMatch(/deleted/)
    expect(db.writes).toHaveLength(0)
  })
})

async function bootWithInsertError() {
  localStorage.clear()
  localStorage.setItem(ACCOUNT_KEY, 'u1')
  db.row = null; db.writes = []
  const store = await import('../core/store')
  localStorage.setItem(store.STORAGE_KEY, JSON.stringify(withProgress(store.defaultData())))
  store.reload()
  const sync = await import('./sync')
  await sync.startSync()
  db.auth!('SIGNED_IN', { user: { id: 'u1' } })
  await sync.syncNow()
  await new Promise(r => setTimeout(r, 0)) // the auth callback's own sync, so it cannot spill into the next test
  await sync.syncNow()
  return { sync }
}
