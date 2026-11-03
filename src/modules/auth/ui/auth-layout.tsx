import { Outlet } from '@tanstack/react-router'
import { AppVersion } from '@/ui/components/app-version'
import { Logo } from '@/ui/components/logo'

export function AuthLayout() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="grid w-full max-w-sm gap-6">
        <Logo className="justify-self-center" />
        <Outlet />
        <AppVersion className="justify-self-center text-sm text-muted-foreground" />
      </div>
    </main>
  )
}
