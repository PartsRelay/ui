import { expect, test } from '@playwright/test'

test.describe('as a newcomer', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock.user', 'new'))
    await page.goto('/')
    await expect(page).toHaveURL('/setup')
    await expect(page.getByRole('heading', { level: 1, name: 'Set up your company' })).toBeVisible()
  })

  test('the setup starts empty, in the browser country', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: 'Company name' })).toBeEmpty()
    await expect(page.getByRole('textbox', { name: 'Your name' })).toBeEmpty()
    await expect(page.getByRole('combobox', { name: 'Country' })).toHaveText('🇺🇸 United States')
    await expect(page.getByRole('combobox')).toHaveCount(1)
    await expect(page.getByText('Signed in as north.garage@gmail.com')).toBeVisible()
  })

  test('the company and my name are required', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue' }).click()

    const company = page.getByRole('textbox', { name: 'Company name' })
    await expect(company).toBeFocused()
    await expect(company).toHaveAccessibleDescription('Enter your company name.')
    await expect(page.getByRole('textbox', { name: 'Your name' })).toHaveAccessibleDescription(
      'Enter your name.'
    )
    await expect(page).toHaveURL('/setup')
  })

  test('setting up opens the app for good', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Company name' }).fill('North Garage Ltd')
    await page.getByRole('textbox', { name: 'Your name' }).fill('Anna North')
    await page.getByRole('combobox', { name: 'Country' }).click()
    await page.getByRole('option', { name: 'Ireland' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL('/lookups')
    await expect(page.getByRole('link', { name: /North Garage Ltd/ })).toBeVisible()
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /^Good (morning|afternoon|evening), Anna North\.$/,
      })
    ).toBeVisible()
    await expect(page.getByText('No searches yet')).toBeVisible()
    await expect(page.getByText('For example: GH482KL · Front brake pads')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Invite your team' })).toHaveAttribute(
      'href',
      '/workspace'
    )
    await expect(page.getByRole('link', { name: 'Connect workshops' })).toHaveAttribute(
      'href',
      '/contacts'
    )
    await page.getByRole('link', { name: 'Start a search' }).click()
    await expect(page).toHaveURL('/lookups/new')
    await expect(page.getByRole('textbox', { name: 'Request' })).toBeFocused()

    await page.goto('/workspace')
    await expect(page.getByRole('row', { name: /Anna North \(you\)/ })).toContainText('Owner')

    await page.goto('/company')
    await expect(page.getByRole('combobox', { name: 'Country' })).toHaveText('🇮🇪 Ireland')

    await page.goto('/')
    await expect(page).toHaveURL('/lookups')
  })

  test('signing out leaves the setup', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign out' }).click()

    await expect(page).toHaveURL('/login')
  })

  test.describe('in a browser of a country outside the list', () => {
    test.use({ locale: 'en-CA' })

    test('the country starts empty and is required', async ({ page }) => {
      const country = page.getByRole('combobox', { name: 'Country' })
      await expect(country).toHaveText('Choose a country')

      await page.getByRole('textbox', { name: 'Company name' }).fill('North Garage Ltd')
      await page.getByRole('textbox', { name: 'Your name' }).fill('Anna North')
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(country).toBeFocused()
      await expect(country).toHaveAccessibleDescription('Choose the country of your company.')
      await expect(page).toHaveURL('/setup')
    })
  })
})

test.describe('as an owner with a name', () => {
  test('the setup only asks about the company', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock.setup', 'pending'))
    await page.goto('/workspace')

    await expect(page).toHaveURL('/setup')
    await expect(page.getByRole('textbox', { name: 'Company name' })).toBeEmpty()
    await expect(page.getByRole('textbox', { name: 'Your name' })).toHaveCount(0)
  })
})
