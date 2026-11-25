import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { openPortal, startCheckout } from '@/modules/billing/core/subscription.mutation'

const { checkout, portal, assign } = vi.hoisted(() => ({
  checkout: vi.fn(),
  portal: vi.fn(),
  assign: vi.fn(),
}))

vi.mock('@/modules/auth/core/auth.client', () => ({
  authClient: { checkout, customer: { portal } },
}))

beforeEach(() => {
  vi.stubGlobal('window', { location: { assign } })
  assign.mockReset()
})

describe('startCheckout', () => {
  it('asks the checkout of the subscription for the company and opens it', async () => {
    checkout.mockResolvedValue({ url: 'https://polar.sh/checkout/1', redirect: false })

    await startCheckout('1')

    expect(checkout).toHaveBeenCalledWith({
      slug: 'subscription',
      reference_id: '1',
      redirect: false,
    })
    expect(assign).toHaveBeenCalledWith('https://polar.sh/checkout/1')
  })

  it('stays on the page when the core refuses', async () => {
    checkout.mockRejectedValue(new Error('Refused'))

    await expect(startCheckout('1')).rejects.toThrow('Refused')
    expect(assign).not.toHaveBeenCalled()
  })
})

describe('openPortal', () => {
  it('opens the customer portal of Polar', async () => {
    portal.mockResolvedValue({ url: 'https://polar.sh/portal/1', redirect: false })

    await openPortal()

    expect(portal).toHaveBeenCalledWith({ redirect: false })
    expect(assign).toHaveBeenCalledWith('https://polar.sh/portal/1')
  })
})
