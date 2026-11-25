import { expect, type Page, test } from '@playwright/test'

const card = (page: Page) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText('Subscription', { exact: true }) })

async function openCompany(page: Page) {
  await page.goto('/company')
  await expect(page.getByRole('heading', { level: 1, name: 'Company' })).toBeVisible()
}

test('the owner subscribes the company and then manages the subscription', async ({ page }) => {
  await openCompany(page)
  await expect(
    card(page).getByText('Your company has no subscription yet. Polar handles the payment.')
  ).toBeVisible()

  await card(page).getByRole('button', { name: 'Subscribe' }).click()

  await expect(page).toHaveURL('/company?checkout_id=mock')
  await expect(
    card(page).getByText(/^Parts Relay is active and renews on \d+ \w+ \d{4}\.$/)
  ).toBeVisible()
  await expect(card(page).getByRole('button', { name: 'Subscribe' })).toHaveCount(0)

  await card(page).getByRole('button', { name: 'Manage subscription' }).click()
  await expect(page).toHaveURL('/company?portal=mock')
})

test('a payment Polar has not confirmed yet says so, without a second checkout', async ({
  page,
}) => {
  await page.goto('/company?checkout_id=pending')

  await expect(
    card(page).getByText('Payment received. The subscription shows here in a moment.')
  ).toBeVisible()
  await expect(card(page).getByRole('button')).toHaveCount(0)
})

test('a core without Polar shows no subscription', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mock.billing', 'off'))
  await openCompany(page)

  await expect(page.getByRole('heading', { name: 'Delete company' })).toBeVisible()
  await expect(page.getByText('Subscription', { exact: true })).toHaveCount(0)
})
