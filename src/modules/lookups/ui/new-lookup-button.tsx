import { Link, useMatch } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import type { LookupPrefill } from '@/modules/lookups/core/lookup-form'
import { Button } from '@/ui/components/ui/button'
import { useFlag } from '@/ui/hooks/use-flag'

type NewLookupButtonProps = Omit<ComponentProps<typeof Button>, 'asChild'> & {
  prefill?: LookupPrefill
}

export function NewLookupButton({ prefill, children, ...props }: NewLookupButtonProps) {
  const { t } = useTranslation()
  const onQueue = useMatch({ from: '/_app/(lookups)/lookups/', shouldThrow: false })
  const aiSearch = useFlag('ai-search')

  if (aiSearch) {
    return (
      <Button {...props} asChild>
        <Link to="/lookups/new" search={{ ...prefill }}>
          <PlusIcon data-icon="inline-start" />
          {children ?? t('lookups.new.open')}
        </Link>
      </Button>
    )
  }

  return (
    <Button {...props} asChild>
      <Link
        from="/lookups/"
        to="/lookups"
        search={(prev) => ({ ...prev, ...prefill, new: true })}
        resetScroll={!onQueue}
      >
        <PlusIcon data-icon="inline-start" />
        {children ?? t('lookups.new.open')}
      </Link>
    </Button>
  )
}
