import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router'
import { appHead } from '@/core/head'
import { cookiebotEnabled } from '@/modules/consent/core/cookiebot'
import { CookieBanner } from '@/modules/consent/ui/cookie-banner'
import { ErrorScreen, NotFoundScreen } from '@/modules/workspaces/ui/status-screen'
import { Devtools } from '@/ui/components/devtools'
import { Toaster } from '@/ui/components/ui/sonner'
import { TooltipProvider } from '@/ui/components/ui/tooltip'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: appHead,
  component: RootLayout,
  errorComponent: ErrorScreen,
  notFoundComponent: NotFoundScreen,
})

function RootLayout() {
  return (
    <TooltipProvider>
      <HeadContent />
      <Outlet />
      {cookiebotEnabled && <CookieBanner />}
      <Toaster toastOptions={{ className: 'font-sans' }} />
      <Devtools />
    </TooltipProvider>
  )
}
