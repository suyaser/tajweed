import { useEffect, useState, useSyncExternalStore } from 'react'
import type { Reciter, Verse } from '../core/types'
import { Player } from './player'

/** Pass a memoised `verses` array: a new array identity reloads (and stops) the player. */
export function usePlayer(verses?: Verse[], reciter?: Reciter) {
  const [player] = useState(() => new Player())
  const state = useSyncExternalStore(player.subscribe, player.getState)
  useEffect(() => { if (verses && reciter) player.load(verses, reciter) }, [player, verses, reciter])
  useEffect(() => () => player.destroy(), [player])
  return { state, player }
}
