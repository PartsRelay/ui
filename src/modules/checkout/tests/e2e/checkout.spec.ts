import { expect, type Page, test } from '@playwright/test'

const CHAT = 'https://wa.me/390287341190'
const WHATSAPP =
  'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36 WhatsApp/2.26.1'

async function open(page: Page, token = 'demo') {
  await page.route(`${CHAT}**`, (route) => route.fulfill({ body: 'WhatsApp chat' }))
  await page.goto(`/checkout?token=${token}`)
}

async function choose(page: Page) {
  await expect(
    page.getByRole('heading', { level: 1, name: 'Order from Redwood Parts Ltd' })
  ).toBeVisible()
  await expect(page.getByText('AB123CD · Fiat Panda 1.2 · front brake pads')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirm order' })).toBeDisabled()

  await page.getByRole('button', { name: 'One more of BREMBO P 23 141' }).click()
  await page.getByRole('button', { name: 'One more of BREMBO P 23 141' }).click()
  await page.getByRole('button', { name: 'One more of OEM 46402682' }).click()
  await page.getByRole('button', { name: 'One more of TRW GDB1891' }).click()
  await page.getByRole('button', { name: 'One less of TRW GDB1891' }).click()
  await expect(page.getByRole('status').filter({ hasText: '3 parts chosen' })).toBeVisible()
}

test('orders the chosen parts and goes back to the WhatsApp chat', async ({ page }) => {
  await open(page)
  await choose(page)

  await page.getByRole('button', { name: 'Confirm order' }).click()
  await page.waitForURL(CHAT)

  await page.goto('/checkout?token=demo')
  await expect(page.getByRole('heading', { level: 1, name: 'Order sent' })).toBeVisible()
  await expect(page.getByText('2 × BREMBO P 23 141')).toBeVisible()
  await expect(page.getByText('1 × OEM 46402682')).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(2)
})

test('shows the price and the stock of a part, a dash when not loaded', async ({ page }) => {
  await open(page)

  const part = (name: string) => page.getByRole('listitem').filter({ hasText: name })

  await expect(part('BREMBO P 23 141')).toContainText('Price €48.90')
  await expect(part('BREMBO P 23 141')).toContainText('Available 4')
  await expect(part('TRW GDB1891')).toContainText('Available 0')
  await expect(part('BOSCH 0 986 494 597')).toContainText('Price —')
  await expect(part('BOSCH 0 986 494 597')).toContainText('Available —')
})

test.describe('in the browser of WhatsApp', () => {
  test.use({ userAgent: WHATSAPP })

  test('stays on the page with the order and the way back to the chat', async ({ page }) => {
    await open(page)
    await choose(page)

    await page.getByRole('button', { name: 'Confirm order' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Order sent' })).toBeVisible()
    await expect(page.getByText('2 × BREMBO P 23 141')).toBeVisible()
    await expect(page.getByText('You can close this page.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to WhatsApp' })).toHaveAttribute('href', CHAT)
    await expect(page).toHaveURL('/checkout?token=demo')
  })

  test('closes the link without an order after asking', async ({ page }) => {
    await open(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.getByRole('button', { name: "Don't order" }).click()
    const dialog = page.getByRole('alertdialog', { name: 'Close without ordering?' })
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()

    await page.getByRole('button', { name: "Don't order" }).click()
    await dialog.getByRole('button', { name: "Don't order" }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Order cancelled' })).toBeVisible()
    await expect(page.getByText('Nothing was sent to Redwood Parts Ltd.')).toBeVisible()
    await expect(page.getByRole('listitem')).toHaveCount(0)
  })
})

test('tells when the link is expired or missing', async ({ page }) => {
  for (const address of ['/checkout?token=expired', '/checkout']) {
    await page.goto(address)
    await expect(
      page.getByRole('heading', { level: 1, name: 'This link is no longer valid' })
    ).toBeVisible()
  }
})

test('opens in the language of the link', async ({ page }) => {
  const request = page.waitForRequest('**/api/v1/checkouts/demo')
  await page.goto('/checkout?token=demo&lng=it-IT')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Ordina da Redwood Parts Ltd' })
  ).toBeVisible()
  await expect(page.getByText('Kit pastiglie freno anteriori')).toBeVisible()
  await expect(page.getByRole('button', { name: "Conferma l'ordine" })).toBeDisabled()
  expect((await request).headers()['accept-language']).toBe('it-IT')
})

test('keeps the language of the browser when the link asks for one the app lacks', async ({
  page,
}) => {
  await page.goto('/checkout?token=demo&lng=fr-FR')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Order from Redwood Parts Ltd' })
  ).toBeVisible()
  await expect(page.getByText('Front brake pad set')).toBeVisible()
})
