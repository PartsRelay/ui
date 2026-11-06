import {
  getApiV1WorkspaceMembers,
  getGetApiV1WorkspaceMembersQueryKey,
} from '@/core/api/endpoints/members/members'
import type { GetApiV1WorkspaceMembersParams } from '@/core/api/models'
import { optionsQuery } from '@/core/options.query'

export function memberOptionsQuery(params: GetApiV1WorkspaceMembersParams) {
  return optionsQuery(getGetApiV1WorkspaceMembersQueryKey(params), getApiV1WorkspaceMembers, params)
}
