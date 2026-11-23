import { cn } from 'cn'

// The bubble of the logo, alone
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 128 112"
      aria-hidden="true"
      focusable="false"
      className={cn('size-8 shrink-0', className)}
    >
      <path
        className="fill-foreground"
        fillRule="evenodd"
        d="M30 4h68c14.36 0 26 11.64 26 26v35c0 14.36-11.64 26-26 26H40l-20.5 15.5c-2.5 2-6 .2-6-3V86.7C7.7 82 4 74.2 4 65V30C4 15.64 15.64 4 30 4m0 9h68c9.39 0 17 7.61 17 17v35c0 9.39-7.61 17-17 17H37L22.5 93V80.3C16.6 77.5 13 71.7 13 65V30c0-9.39 7.61-17 17-17"
      />
      <path
        className="stroke-primary"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="6"
        d="M34 63h23c3 0 5-2 5-5V43c0-3.5 2.5-6 6-6h26"
      />
      <circle className="fill-primary" cx="34" cy="63" r="6.3" />
      <circle className="fill-primary" cx="94" cy="37" r="6.3" />
    </svg>
  )
}
