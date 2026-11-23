import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/contacts')
  await expect(page.getByRole('heading', { level: 1, name: 'Contacts' })).toBeVisible()
})

test('shows the number workshops write to and its link', async ({ page }) => {
  await expect(page.getByText('+39 02 8734 1190')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open chat' })).toHaveAttribute(
    'href',
    'https://wa.me/390287341190'
  )
  await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible()
})

test('a tab and a search keep the scroll', async ({ page }) => {
  const scroll = () => page.evaluate(() => Math.round(window.scrollY))
  const tab = page.getByRole('tab', { name: 'Active' })

  await page.setViewportSize({ width: 1280, height: 480 })
  await tab.evaluate((element) =>
    window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top - 200)
  )
  const before = await scroll()

  await tab.click()
  await expect(page).toHaveURL('/contacts?status=active')
  await page.getByRole('searchbox', { name: 'Search' }).fill('garage')
  await expect(page).toHaveURL('/contacts?status=active&search=garage')

  expect(before).toBeGreaterThan(0)
  expect(await scroll()).toBe(before)
})

test('finds contacts by name or number, also within a tab', async ({ page }) => {
  const search = page.getByRole('searchbox', { name: 'Search' })

  await search.fill('oak')
  await expect(page).toHaveURL('/contacts?search=oak')
  await expect(page.getByText('1 contact', { exact: true })).toBeVisible()
  await expect(page.getByRole('row', { name: /Oakfield Garage/ })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Joined' })).toBeVisible()

  await search.fill('900105')
  await expect(page.getByText('1 contact', { exact: true })).toBeVisible()
  await expect(page.getByRole('row', { name: /Quick Fit Tyres/ })).toBeVisible()

  await page.getByRole('tab', { name: 'Active' }).click()
  await expect(page).toHaveURL(/\/contacts\?search=.*900105.*&status=active$/)
  await expect(page.getByText('No contacts match the search')).toBeVisible()
})

test('a number of another company can be added here too', async ({ page }) => {
  await page.getByRole('button', { name: 'Add contact' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add a contact' })
  await dialog.getByRole('textbox', { name: 'WhatsApp number' }).fill('+1 202 555 0189')
  await dialog.getByRole('button', { name: 'Add contact' }).click()

  await expect(dialog).toBeHidden()
  await expect(page.getByRole('row', { name: /202.*555.*0189/ })).toBeVisible()
})

test('a number in 3 companies explains why under the field', async ({ page }) => {
  await page.getByRole('button', { name: 'Add contact' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add a contact' })
  const phone = dialog.getByRole('textbox', { name: 'WhatsApp number' })
  await phone.fill('+1 202 555 0188')
  await dialog.getByRole('button', { name: 'Add contact' }).click()

  await expect(phone).toHaveAccessibleDescription(
    'This number already belongs to as many companies as it can.'
  )
})

test('the number starts empty with a number of the country of the company', async ({ page }) => {
  await page.getByRole('button', { name: 'Add contact' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add a contact' })
  const phone = dialog.getByRole('textbox', { name: 'WhatsApp number' })

  await expect(phone).toHaveValue('')
  await expect(phone).toHaveAttribute('placeholder', '+447400123456')
  await expect(phone).toHaveAccessibleDescription('With the international prefix, for example +44.')
})

test('a first digit gets a plus and a plus typed first stays alone', async ({ page }) => {
  await page.getByRole('button', { name: 'Add contact' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add a contact' })
  const phone = dialog.getByRole('textbox', { name: 'WhatsApp number' })

  await phone.pressSequentially('3')
  await expect(phone).toHaveValue('+3')
  await phone.fill('')
  await phone.pressSequentially('+')
  await expect(phone).toHaveValue('+')
  await phone.pressSequentially('39')
  await expect(phone).toHaveValue('+39')
  await phone.pressSequentially('+')
  await expect(phone).toHaveValue('+39')
})

test('the number takes only digits', async ({ page }) => {
  await page.getByRole('button', { name: 'Add contact' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add a contact' })
  const phone = dialog.getByRole('textbox', { name: 'WhatsApp number' })

  await phone.pressSequentially('ab')
  await expect(phone).toHaveValue('')
  await phone.pressSequentially('3a9 3-38')
  await expect(phone).toHaveValue('+39338')
})

test('deleting the whole number leaves it empty', async ({ page }) => {
  await page.getByRole('button', { name: 'Add contact' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add a contact' })
  const phone = dialog.getByRole('textbox', { name: 'WhatsApp number' })

  await phone.pressSequentially('39')
  await phone.press('Backspace')
  await phone.press('Backspace')
  await expect(phone).toHaveValue('+')
  await phone.press('Backspace')
  await expect(phone).toHaveValue('')
  await phone.pressSequentially('39 338')
  await phone.press('ControlOrMeta+a')
  await phone.press('Delete')
  await expect(phone).toHaveValue('')

  await phone.pressSequentially('39')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  await page.getByRole('button', { name: 'Add contact' }).click()
  await expect(phone).toHaveValue('')
})

test('a pasted number keeps its digits after one plus', async ({ page }) => {
  await page.getByRole('button', { name: 'Add contact' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add a contact' })
  const phone = dialog.getByRole('textbox', { name: 'WhatsApp number' })
  await expect(phone).toBeFocused()

  await page.keyboard.insertText('+39 300 000 0000')
  await expect(phone).toHaveValue('+393000000000')
  await phone.fill('')
  await page.keyboard.insertText('0039 300 000 0000')
  await expect(phone).toHaveValue('+00393000000000')
  await phone.fill('')
  await page.keyboard.insertText('39 300 000 0000')
  await expect(phone).toHaveValue('+393000000000')
  await phone.fill('')
  await page.keyboard.insertText('Tel. 300 000 0000')
  await expect(phone).toHaveValue('+3000000000')
})

test('the caret stays where I edit the number', async ({ page }) => {
  await page.getByRole('button', { name: 'Add contact' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add a contact' })
  const phone = dialog.getByRole('textbox', { name: 'WhatsApp number' })
  await expect(phone).toBeFocused()

  await page.keyboard.type('338')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Backspace')
  await expect(phone).toHaveValue('+338')
  await page.keyboard.type('3a9 ')
  await expect(phone).toHaveValue('+39338')
})

test('an empty number or only the plus is missing', async ({ page }) => {
  await page.getByRole('button', { name: 'Add contact' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add a contact' })
  const phone = dialog.getByRole('textbox', { name: 'WhatsApp number' })
  await dialog.getByRole('button', { name: 'Add contact' }).click()

  await expect(phone).toHaveAccessibleDescription('Enter the WhatsApp number.')
  await expect(phone).toHaveValue('')

  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  await page.getByRole('button', { name: 'Add contact' }).click()
  await expect(phone).toHaveAccessibleDescription('With the international prefix, for example +44.')
  await phone.pressSequentially('+')
  await dialog.getByRole('button', { name: 'Add contact' }).click()
  await expect(phone).toHaveAccessibleDescription('Enter the WhatsApp number.')
  await expect(phone).toHaveValue('+')
})

test('without the regional-format flag every number keeps its prefix', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Search' }).fill('oak')
  await expect(page.getByRole('row', { name: /Oakfield Garage/ })).toContainText('+44 7700 900101')
})

test.describe('with the regional-format flag in a British company', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock.flags', 'regional-format'))
    await page.goto('/contacts')
    await expect(page.getByRole('heading', { level: 1, name: 'Contacts' })).toBeVisible()
  })

  test('a British number is written as in the UK, another one with its prefix', async ({
    page,
  }) => {
    const search = page.getByRole('searchbox', { name: 'Search' })

    await search.fill('oak')
    await expect(page.getByRole('row', { name: /Oakfield Garage/ })).toContainText('07700 900101')
    await search.fill('capitol')
    await expect(page.getByRole('row', { name: /Capitol Auto Care/ })).toContainText(
      '+1 202 555 0106'
    )
  })
})

test('with the contact-country flag a number shows its country', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mock.flags', 'contact-country'))
  await page.goto('/contacts')
  const search = page.getByRole('searchbox', { name: 'Search' })

  await search.fill('capitol')
  await expect(
    page.getByRole('row', { name: /Capitol Auto Care/ }).getByRole('img', { name: 'United States' })
  ).toBeVisible()
  await search.fill('oak')
  await expect(page.getByRole('row', { name: /Oakfield Garage/ }).getByRole('img')).toHaveCount(0)
})

test('without the contact-country flag no number shows a country', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Search' }).fill('capitol')

  await expect(page.getByRole('row', { name: /Capitol Auto Care/ }).getByRole('img')).toHaveCount(0)
})
