import { useEffect, useState, useSyncExternalStore } from 'react'
import { Recorder } from './recorder'

export function useRecorder() {
  const [rec] = useState(() => new Recorder())
  const state = useSyncExternalStore(rec.subscribe, rec.getState)
  useEffect(() => () => rec.stop(), [rec]) // stopping still resolves start() with the take
  return { state, start: () => rec.start(), stop: () => rec.stop() }
}
