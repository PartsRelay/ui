import { postApiV1LookupsPreview } from '@/core/api/endpoints/lookups/lookups'
import type { PostApiV1LookupsPreviewBody } from '@/core/api/models'

export async function previewLookup(lookup: PostApiV1LookupsPreviewBody) {
  const { data } = await postApiV1LookupsPreview(lookup)

  return data
}
