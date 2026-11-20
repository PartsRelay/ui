import { expect, type Page, test } from '@playwright/test'

const notices = (page: Page) => page.getByRole('region', { name: /Notifications/ })

const firstSearch = (page: Page) =>
  page
    .getByRole('table')
    .filter({ has: page.getByRole('columnheader', { name: 'Plate' }) })
    .getByRole('row')
    .nth(1)

async function openProfile(page: Page) {
  await page.goto('/profile')
  await expect(page.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible()
}

test.describe('as the owner', () => {
  test.beforeEach(({ page }) => openProfile(page))

  test('renaming me updates the whole app', async ({ page }) => {
    const name = page.getByRole('textbox', { name: 'Name' })
    await expect(name).toHaveValue('Mark Reed')

    await name.fill('  Mark Reed Jr  ')
    await page.getByRole('button', { name: 'Save name' }).click()

    await expect(notices(page).getByText('Name saved.')).toBeVisible()
    await expect(name).toHaveValue('Mark Reed Jr')
    await expect(page.getByRole('button', { name: /Mark Reed Jr/ })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Mark Reed Jr')
  })

  test('my name cannot be empty', async ({ page }) => {
    const name = page.getByRole('textbox', { name: 'Name' })

    await name.fill('   ')
    await page.getByRole('button', { name: 'Save name' }).click()

    await expect(name).toBeFocused()
    await expect(name).toHaveAccessibleDescription('Enter your name.')

    await name.fill('Mark')
    await expect(name).toHaveAccessibleDescription('Your team sees it next to your email.')
  })

  test('the language is chosen for this device', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Language' }).click()
    await page.getByRole('option', { name: 'Italian' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Profilo' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('combobox', { name: 'Lingua' })).toHaveText('Italiano')
  })

  test('without the flag the country is the one of the company', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2, name: 'Country' })).toHaveCount(0)
    await expect(page.getByRole('combobox')).toHaveCount(1)
    await expect(page.getByRole('combobox', { name: 'Language' })).toBeVisible()
  })

  test('signing out of this device opens the login', async ({ page }) => {
    await page.getByRole('main').getByRole('button', { name: 'Sign out', exact: true }).click()

    await expect(page).toHaveURL('/login')
    await expect(notices(page).getByText('You signed out.')).toBeVisible()
  })

  test('signing out everywhere opens the login', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign out everywhere' }).click()

    await expect(page).toHaveURL('/login')
    await expect(notices(page).getByText('You signed out on every device.')).toBeVisible()
  })

  test('the owner has to hand over the company before leaving', async ({ page }) => {
    await expect(page.getByText('The owner cannot leave')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Leave company' })).toHaveCount(0)

    await page.getByRole('link', { name: 'Transfer ownership' }).click()
    await expect(page).toHaveURL('/workspace?transfer=true')
    await expect(page.getByRole('alertdialog', { name: 'Transfer ownership' })).toBeVisible()
  })
})

test.describe('as a viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock.user', 'viewer'))
  })

  test('leaving the company deletes my account and signs me out', async ({ page }) => {
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Leave company' }).click()

    const dialog = page.getByRole('alertdialog', { name: 'Leave Redwood Parts Ltd?' })
    await dialog.getByRole('button', { name: 'Leave and delete my account' }).click()

    await expect(page).toHaveURL('/login')
    await expect(
      notices(page).getByText('You left Redwood Parts Ltd and your account was deleted.')
    ).toBeVisible()
  })
})

test.describe('with my own country, in an American browser', () => {
  test.use({ locale: 'en-US', timezoneId: 'America/New_York' })

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock.flags', 'personal-country'))
    await page.clock.setFixedTime(new Date('2026-11-17T20:04:00Z'))
  })

  test('dates follow my country until I go back to the one of the company', async ({ page }) => {
    await page.goto('/lookups')
    await expect(firstSearch(page)).toContainText('17 Nov 2026, 15:03')

    await openProfile(page)
    const country = page.getByRole('combobox', { name: 'Country' })
    await expect(country).toHaveText('Same as the company (🇬🇧 United Kingdom)')
    await country.click()
    await page.getByRole('option', { name: 'United States' }).click()

    await expect(notices(page).getByText('Country set to United States.')).toBeVisible()
    await expect(country).toHaveText('🇺🇸 United States')
    await page.reload()
    await expect(page.getByRole('combobox', { name: 'Country' })).toHaveText('🇺🇸 United States')

    await page.goto('/lookups')
    await expect(firstSearch(page)).toContainText(/Nov 17, 2026, 3:03\sPM/)

    await openProfile(page)
    await page.getByRole('combobox', { name: 'Country' }).click()
    await page.getByRole('option', { name: /^Same as the company/ }).click()

    await expect(notices(page).getByText('You now use the country of the company.')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('combobox', { name: 'Country' })).toHaveText(
      'Same as the company (🇬🇧 United Kingdom)'
    )

    await page.goto('/lookups')
    await expect(firstSearch(page)).toContainText('17 Nov 2026, 15:03')
  })
})
