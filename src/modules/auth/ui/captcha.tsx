import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import type { Ref } from 'react'
import { turnstileSiteKey } from '@/modules/auth/core/sign-in'

export function Captcha({ ref }: { ref: Ref<TurnstileInstance | undefined> }) {
  if (!turnstileSiteKey) return null

  return (
    <Turnstile
      ref={ref}
      siteKey={turnstileSiteKey}
      options={{ appearance: 'interaction-only', size: 'flexible' }}
    />
  )
}
