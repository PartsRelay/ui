import { describe, expect, it } from 'vite-plus/test'
import { apiKeyViews } from '@/modules/developers/core/api-keys'

const key = (id: string, configId: string, start: string, createdAt: string) => ({
  id,
  configId,
  start,
  createdAt: new Date(createdAt),
})

const testKey = key('4', 'test', 'test_qWeRtYu', '2026-10-21T10:00:00Z')
const liveKey = key('7', 'live', 'live_aSdFgHj', '2026-11-02T09:30:00Z')

describe('apiKeyViews', () => {
  it('shows the test key and then the live key, each with its start and its date', () => {
    expect(apiKeyViews([liveKey, testKey], 'en-US')).toEqual([
      { mode: 'test', key: { id: '4', start: 'test_qWeRtYu', created: 'Oct 21, 2026' } },
      { mode: 'live', key: { id: '7', start: 'live_aSdFgHj', created: 'Nov 2, 2026' } },
    ])
  })

  it('leaves a mode without a key empty', () => {
    expect(apiKeyViews([liveKey], 'en-US')).toEqual([
      { mode: 'test' },
      { mode: 'live', key: { id: '7', start: 'live_aSdFgHj', created: 'Nov 2, 2026' } },
    ])
    expect(apiKeyViews([], 'en-US')).toEqual([{ mode: 'test' }, { mode: 'live' }])
  })

  it('writes the date in the language of the app', () => {
    const [view] = apiKeyViews([testKey], 'it-IT')

    expect(view.key?.created).toBe('21 ott 2026')
  })
})
