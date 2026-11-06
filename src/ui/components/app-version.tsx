import { cn } from 'cn'
import { appVersion } from '@/core/version'

export function AppVersion({ className }: { className?: string }) {
  return appVersion && <span className={cn('tabular-nums', className)}>{appVersion}</span>
}
