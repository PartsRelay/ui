import { useEffect } from 'react'
import { loadFlags, SIGNED_OUT } from '@/core/flags'
import { magicLinkShown } from '@/modules/auth/core/sign-in'
import { useFlag } from '@/ui/hooks/use-flag'

export function useMagicLink() {
  useEffect(() => loadFlags(SIGNED_OUT), [])

  return magicLinkShown(useFlag('magic-link'))
}
