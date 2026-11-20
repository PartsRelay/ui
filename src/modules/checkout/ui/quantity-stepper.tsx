import { MinusIcon, PlusIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MAX_QUANTITY } from '@/modules/checkout/core/checkout'
import { Button } from '@/ui/components/ui/button'

type QuantityStepperProps = { name: string; value: number; onChange: (value: number) => void }

export function QuantityStepper({ name, value, onChange }: QuantityStepperProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-none items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label={t('checkout.decrease', { name })}
        disabled={value === 0}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon />
      </Button>
      <output className="w-7 text-center font-semibold tabular-nums">{value}</output>
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label={t('checkout.increase', { name })}
        disabled={value === MAX_QUANTITY}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon />
      </Button>
    </div>
  )
}
