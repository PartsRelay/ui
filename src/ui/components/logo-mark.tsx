import { cn } from 'cn'
import logo from '@/assets/logo.svg'
import reversedLogo from '@/assets/logo-reversed.svg'

const CUT = 'size-full object-cover object-left'

// The bubble of the logo files, without the name
export function LogoMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('block aspect-[140/129] h-8 shrink-0', className)}>
      <img src={logo} alt="" className={cn(CUT, 'dark:hidden')} />
      <img src={reversedLogo} alt="" className={cn(CUT, 'hidden dark:block')} />
    </span>
  )
}
