import { useMutation } from '@tanstack/react-query'
import type { PostApiV1LookupsPreviewBody } from '@/core/api/models'
import { previewFieldErrors } from '@/modules/lookups/core/parts-preview'
import { previewLookup } from '@/modules/lookups/core/parts-preview.mutation'
import { reportError } from '@/query-client'

export function usePreviewLookup() {
  return useMutation({
    mutationFn: (lookup: PostApiV1LookupsPreviewBody) => previewLookup(lookup),
    onError: (error) => reportError(error, previewFieldErrors(error) !== null),
  })
}
