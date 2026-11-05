import { useDebouncedCallback } from '@tanstack/react-pacer'
import { cn } from 'cn'
import { ChevronDownIcon } from 'lucide-react'
import { type UIEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/ui/components/text-field'
import { Button } from '@/ui/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/ui/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/components/ui/popover'
import { Spinner } from '@/ui/components/ui/spinner'

export type AutocompleteGroup<Item> = { label?: string; items: Item[] }

export type AutocompletePages = {
  isPending: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => unknown
}

type AutocompleteFieldProps<Item> = {
  label: string
  placeholder?: string
  value: Item | null
  groups: AutocompleteGroup<Item>[]
  pages: AutocompletePages
  itemKey: (item: Item) => string
  itemLabel: (item: Item) => string
  onValueChange: (item: Item) => void
  onSearch: (search: string) => void
}

const NEAR_END = 48

export function AutocompleteField<Item>({
  label,
  placeholder,
  value,
  groups,
  pages,
  itemKey,
  itemLabel,
  onValueChange,
  onSearch,
}: AutocompleteFieldProps<Item>) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const search = useDebouncedCallback((next: string) => onSearch(next.trim()), { wait: 300 })
  const selected = value === null ? undefined : itemKey(value)

  const type = (next: string) => {
    setText(next)
    search(next)
  }

  const toggle = (next: boolean) => {
    setOpen(next)
    if (!next) type('')
  }

  const loadMore = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    if (scrollHeight - scrollTop - clientHeight > NEAR_END) return
    if (pages.hasNextPage && !pages.isFetchingNextPage) void pages.fetchNextPage()
  }

  return (
    <Popover open={open} onOpenChange={toggle} modal>
      <TextField label={label}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full min-w-0 justify-between font-normal"
          >
            <span className={cn('truncate', value === null && 'text-muted-foreground')}>
              {value === null ? placeholder : itemLabel(value)}
            </span>
            <ChevronDownIcon className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
      </TextField>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command shouldFilter={false} label={t('common.search')}>
          <CommandInput value={text} onValueChange={type} placeholder={t('common.search')} />
          <CommandList onScroll={loadMore}>
            <CommandEmpty>
              {t(pages.isPending ? 'common.loading' : 'common.no-results')}
            </CommandEmpty>
            {groups
              .filter(({ items }) => items.length > 0)
              .map((group, index) => (
                <CommandGroup key={group.label ?? index} heading={group.label}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={itemKey(item)}
                      value={itemKey(item)}
                      data-checked={itemKey(item) === selected}
                      className="wrap-anywhere"
                      onSelect={() => {
                        onValueChange(item)
                        toggle(false)
                      }}
                    >
                      {itemLabel(item)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            {pages.isFetchingNextPage && (
              <div className="flex justify-center py-2">
                <Spinner />
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
