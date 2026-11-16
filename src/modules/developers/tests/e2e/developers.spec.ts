import { expect, type Page, test } from '@playwright/test'

const notices = (page: Page) => page.getByRole('region', { name: /Notifications/ })

const denied = (page: Page) =>
  page.getByRole('heading', { level: 1, name: "You don't have access to this page." })

const start = (key: string) => `${key.slice(0, 12)}…`

async function create(page: Page, mode: 'test' | 'live') {
  await page.getByRole('button', { name: `Create ${mode} key` }).click()
  const secret = page.getByText(new RegExp(`^${mode}_[A-Za-z]{64}$`))
  await expect(secret).toBeVisible()

  return secret.innerText()
}

test.describe('as the owner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/developers')
    await expect(page.getByRole('heading', { level: 1, name: 'Developers' })).toBeVisible()
  })

  test('the sidebar, the breadcrumbs and the title show where I am', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Developers', disabled: false })).toHaveAttribute(
      'aria-current',
      'page'
    )
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveText('Developers')
    await expect(page).toHaveTitle(/^Developers · /)
  })

  test('a new key is shown once, then only its start and its date', async ({ page }) => {
    await expect(page.getByText('No test key yet.')).toBeVisible()
    await expect(page.getByText('No live key yet.')).toBeVisible()

    const key = await create(page, 'test')

    await expect(notices(page).getByText('Key created.')).toBeVisible()
    await expect(
      page.getByText('It is shown only this once. If you lose it, replace the key.')
    ).toBeVisible()
    await expect(page.getByText(start(key))).toBeVisible()
    await expect(
      page.getByText(
        await page.evaluate(() => new Date().toLocaleDateString('en-US', { dateStyle: 'medium' }))
      )
    ).toBeVisible()
    expect(
      await page.evaluate(() => JSON.stringify([{ ...localStorage }, { ...sessionStorage }]))
    ).not.toContain(key)

    await page.reload()
    await expect(page.getByText(start(key))).toBeVisible()
    await expect(page.getByText(key)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Copy key' })).toHaveCount(0)
  })

  test('the new key is gone once I leave the page', async ({ page }) => {
    const key = await create(page, 'test')

    await page.getByRole('link', { name: 'Company' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Company' })).toBeVisible()
    await page.getByRole('link', { name: 'Developers' }).click()

    await expect(page.getByText(start(key))).toBeVisible()
    await expect(page.getByText(key)).toHaveCount(0)
  })

  test('copying the new key puts the whole key in the clipboard', async ({ page }) => {
    const key = await create(page, 'test')
    await page.evaluate(() => {
      let copied = ''
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async (text: string) => {
            copied = text
          },
          readText: async () => copied,
        },
      })
    })

    await page.getByRole('button', { name: 'Copy key' }).click()

    await expect(notices(page).getByText('Key copied.')).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(key)
  })

  test('replacing a key asks first and shows the new one once', async ({ page }) => {
    const old = await create(page, 'test')

    await page.getByRole('button', { name: 'Replace test key' }).click()
    const dialog = page.getByRole('alertdialog', { name: 'Replace the test key?' })
    await expect(dialog).toContainText('The current key stops working at once')
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByText(old)).toBeVisible()

    await page.getByRole('button', { name: 'Replace test key' }).click()
    await dialog.getByRole('button', { name: 'Replace key' }).click()

    await expect(dialog).toBeHidden()
    await expect(
      notices(page).getByText('Key replaced. The old one no longer works.')
    ).toBeVisible()
    await expect(page.getByText(old)).toHaveCount(0)
    await expect(page.getByText(start(old))).toHaveCount(0)
    const key = await page.getByText(/^test_[A-Za-z]{64}$/).innerText()
    await expect(page.getByText(start(key))).toBeVisible()
  })

  test('deleting a key asks first and leaves the mode without a key', async ({ page }) => {
    const key = await create(page, 'test')

    await page.getByRole('button', { name: 'Delete test key' }).click()
    const dialog = page.getByRole('alertdialog', { name: 'Delete the test key?' })
    await expect(dialog).toContainText('The key stops working at once.')
    await dialog.getByRole('button', { name: 'Delete key' }).click()

    await expect(dialog).toBeHidden()
    await expect(notices(page).getByText('Key deleted. It no longer works.')).toBeVisible()
    await expect(page.getByText('No test key yet.')).toBeVisible()
    await expect(page.getByText(key)).toHaveCount(0)
    await expect(page.getByText(start(key))).toHaveCount(0)

    await page.reload()
    await expect(page.getByRole('button', { name: 'Create test key' })).toBeVisible()
  })

  test('the live key lives apart from the test key', async ({ page }) => {
    const testKey = await create(page, 'test')
    const liveKey = await create(page, 'live')
    await expect(page.getByText(testKey)).toBeVisible()

    await page.getByRole('button', { name: 'Delete test key' }).click()
    await page
      .getByRole('alertdialog', { name: 'Delete the test key?' })
      .getByRole('button', { name: 'Delete key' })
      .click()

    await expect(page.getByText('No test key yet.')).toBeVisible()
    await expect(page.getByText(liveKey)).toBeVisible()
    await expect(page.getByText(start(liveKey))).toBeVisible()
    await expect(page.getByRole('button', { name: 'Replace live key' })).toBeVisible()
  })
})

test.describe('as an admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock.user', 'admin'))
  })

  test('the developers page is not available', async ({ page }) => {
    await page.goto('/workspace')
    await expect(page.getByRole('heading', { level: 1, name: 'Workspace' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Developers' })).toHaveCount(0)

    await page.goto('/developers')
    await expect(denied(page)).toBeVisible()
    await expect(page.getByText('Ask Mark Reed, your company owner, for help.')).toBeVisible()
  })
})

test.describe('as a viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock.user', 'viewer'))
  })

  test('the developers page is not available', async ({ page }) => {
    await page.goto('/contacts')
    await expect(page.getByRole('heading', { level: 1, name: 'Contacts' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Developers' })).toHaveCount(0)

    await page.goto('/developers')
    await expect(denied(page)).toBeVisible()
    await expect(page.getByText('Ask Mark Reed, your company owner, for help.')).toBeVisible()
  })
})
