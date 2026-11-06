import { setupWorker } from 'msw/browser'
import * as apiMocks from '@/core/api/endpoints/index.msw'
import { authMocks } from '@/mocks/auth'
import { contactMocks } from '@/mocks/contacts'
import { lookupMocks } from '@/mocks/lookups'
import { memberMocks } from '@/mocks/members'

const generated = Object.values(apiMocks).flatMap((mock) => mock())

export const worker = setupWorker(
  ...authMocks,
  ...memberMocks,
  ...contactMocks,
  ...lookupMocks,
  ...generated
)
