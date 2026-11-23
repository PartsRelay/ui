import { useSyncExternalStore } from 'react'
import { type Flag, flagEnabled, flagsLoaded, onFlags } from '@/core/flags'

export function useFlag(flag: Flag) {
  return useSyncExternalStore(onFlags, () => flagEnabled(flag))
}

export function useFlagsLoaded() {
  return useSyncExternalStore(onFlags, flagsLoaded)
}
