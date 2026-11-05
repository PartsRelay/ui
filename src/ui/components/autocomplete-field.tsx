import { useDebouncedCallback } from '@tanstack/react-pacer'
import type { UIEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/ui/components/text-field'
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '@/ui/components/ui/combobox'
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
  const search = useDebouncedCallback((text: string) => onSearch(text.trim()), { wait: 300 })
  const shown = groups.filter(({ items }) => items.length > 0)

  const loadMore = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    if (scrollHeight - scrollTop - clientHeight > NEAR_END) return
    if (pages.hasNextPage && !pages.isFetchingNextPage) void pages.fetchNextPage()
  }

  return (
    <Combobox
      items={shown}
      filter={null}
      value={value}
      onValueChange={(next: Item | null) => {
        if (next !== null) onValueChange(next)
      }}
      itemToStringLabel={itemLabel}
      itemToStringValue={itemKey}
      isItemEqualToValue={(item: Item, selected: Item) => itemKey(item) === itemKey(selected)}
      onInputValueChange={search}
    >
      <TextField label={label}>
        <ComboboxTrigger className="flex h-8 w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-left text-sm whitespace-nowrap transition-[color,background-color,border-color] outline-none select-none focus-visible:border-ring focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:outline-3 aria-invalid:outline-solid aria-invalid:outline-destructive/20 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:outline-destructive/40">
          <span className="min-w-0 truncate">
            <ComboboxValue
              placeholder={<span className="text-muted-foreground">{placeholder}</span>}
            />
          </span>
        </ComboboxTrigger>
      </TextField>
      <ComboboxContent className="max-w-[calc(100vw-2rem)]">
        <ComboboxInput showTrigger={false} placeholder={t('common.search')} />
        <ComboboxEmpty>{t(pages.isPending ? 'common.loading' : 'common.no-results')}</ComboboxEmpty>
        <ComboboxList onScroll={loadMore}>
          {(group: AutocompleteGroup<Item>, index: number) => (
            <ComboboxGroup key={group.label ?? index} items={group.items}>
              {group.label && <ComboboxLabel>{group.label}</ComboboxLabel>}
              <ComboboxCollection>
                {(item: Item) => (
                  <ComboboxItem key={itemKey(item)} value={item} className="wrap-anywhere">
                    {itemLabel(item)}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
        {pages.isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Spinner />
          </div>
        )}
      </ComboboxContent>
    </Combobox>
  )
}
