import { type NavigateOptions, useNavigate } from '@tanstack/react-router'
import { authClient } from '@/modules/auth/core/auth.client'
import { endSession } from '@/modules/auth/core/session.query'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'

export function useSignOut({ to }: Pick<NavigateOptions, 'to'> = {}) {
  const navigate = useNavigate()
  const { client, pending, run } = useBetterAuthAction()

  const signOut = async (everywhere = false) => {
    const result = await run(
      async () => {
        await (everywhere ? authClient.revokeSessions() : authClient.signOut())
        endSession(client)
      },
      { notice: everywhere ? 'auth.notices.signed-out-everywhere' : 'auth.notices.signed-out' }
    )
    if (result.ok && to) await navigate({ to })
  }

  return { pending, signOut }
}
