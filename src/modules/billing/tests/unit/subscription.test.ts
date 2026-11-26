import { describe, expect, it } from 'vite-plus/test'
import { subscriptionView } from '@/modules/billing/core/subscription'

const subscription = {
  current_period_end: '2026-12-25T10:00:00Z',
  cancel_at_period_end: false,
  product: { name: 'Parts Relay' },
}

describe('subscriptionView', () => {
  it('is none for a company without a subscription', () => {
    expect(subscriptionView([], 'en-GB')).toEqual({ state: 'none' })
  })

  it('names the product and the day it renews, as the locale writes it', () => {
    expect(subscriptionView([subscription], 'en-GB')).toEqual({
      state: 'active',
      product: 'Parts Relay',
      date: '25 Dec 2026',
    })
    expect(subscriptionView([subscription], 'it-IT')).toMatchObject({ date: '25 dic 2026' })
  })

  it('is ending once it was canceled, until the end of the period', () => {
    expect(subscriptionView([{ ...subscription, cancel_at_period_end: true }], 'en-GB')).toEqual({
      state: 'ending',
      product: 'Parts Relay',
      date: '25 Dec 2026',
    })
  })

  it('has no day without the end of a period', () => {
    const undated = [{ ...subscription, current_period_end: null }]

    expect(subscriptionView(undated, 'en-GB')).toMatchObject({ state: 'active', date: null })
  })
})
