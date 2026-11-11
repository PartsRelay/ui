import { expect, type Page, test } from '@playwright/test'

const banner = (page: Page) => page.getByRole('dialog', { name: 'Cookies' })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mock.consent', 'ask'))
  await page.goto('/')
  await expect(banner(page)).toBeVisible()
})

test('asks for the cookies once', async ({ page }) => {
  await banner(page).getByRole('button', { name: 'Only necessary' }).click()
  await expect(banner(page)).toBeHidden()

  await page.reload()
  await page.waitForFunction(() => window.Cookiebot)

  await expect(banner(page)).toBeHidden()
})

test('keeps a custom choice and shows it when the Cookiebot icon asks again', async ({ page }) => {
  const statistics = banner(page).getByRole('switch', { name: 'Statistics' })

  await banner(page).getByRole('button', { name: 'Customize' }).click()

  await expect(banner(page).getByRole('switch', { name: 'Necessary' })).toBeDisabled()
  await expect(statistics).not.toBeChecked()

  await statistics.click()
  await banner(page).getByRole('button', { name: 'Save my choices' }).click()
  await expect(banner(page)).toBeHidden()

  await page.evaluate(() => window.Cookiebot!.renew())
  await banner(page).getByRole('button', { name: 'Customize' }).click()

  await expect(statistics).toBeChecked()
  await expect(banner(page).getByRole('switch', { name: 'Marketing' })).not.toBeChecked()
})
