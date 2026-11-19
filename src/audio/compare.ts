import type { Recording } from '../core/types'
import type { Player } from './player'

export type ComparePhase = 'model' | 'silence' | 'me' | 'done'

/**
 * "Model, then me": plays the player's loaded range once (no gap, no loop), 600ms silence, then the recording.
 * Call from the tap handler: the model starts synchronously (iOS gesture), and the recording reuses the same
 * unlocked <audio> element. Loop/gap settings are restored afterwards. `onPhase` drives the "reciter / You" label.
 */
export function playModelThenMe(player: Player, rec: Recording, onPhase: (p: ComparePhase) => void = () => {}) {
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const url = URL.createObjectURL(rec.blob)
  const { loops, gap } = player.state
  player.stop()
  player.setLoops(1)
  player.setGap('off')
  onPhase('model')
  player.play()
  const model = player.whenDone()
  const done = (async () => {
    try {
      const ok = await model
      player.setLoops(loops)
      player.setGap(gap)
      if (!ok || cancelled) return
      onPhase('silence')
      await new Promise(r => (timer = setTimeout(r, 600)))
      if (cancelled) return
      onPhase('me')
      await player.playSrc(url)
    } finally {
      URL.revokeObjectURL(url)
      onPhase('done')
    }
  })()
  return { done, cancel() { cancelled = true; clearTimeout(timer); player.stop() } }
}

/** "Me": the recording alone. */
export async function playMe(player: Player, rec: Recording) {
  const url = URL.createObjectURL(rec.blob)
  try { return await player.playSrc(url) } finally { URL.revokeObjectURL(url) }
}
