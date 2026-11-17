import { useSyncExternalStore } from 'react'
import { type Flag, flagEnabled, onFlags } from '@/core/flags'

export function useFlag(flag: Flag) {
  return useSyncExternalStore(onFlags, () => flagEnabled(flag))
}
