import { expect, type Locator, type Page, test } from '@playwright/test'

const queue = (page: Page) =>
  page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: 'Plate' }) })

const greeting = /^Good (morning|afternoon|evening), Mark Reed\.$/

const request = (page: Page) => page.getByRole('textbox', { name: 'Request' })

const chat = (page: Page) => page.getByRole('log', { name: 'Conversation' })

const asked = (page: Page) => chat(page).getByRole('article', { name: 'You' })

const answered = (page: Page) => chat(page).getByRole('article', { name: 'Assistant' })

const send = (page: Page) => page.getByRole('button', { name: 'Search', exact: true }).click()

// Asks the assistant, then opens the result once the search ends
async function startSearch(page: Page, message: string) {
  await page.getByRole('link', { name: 'New search' }).first().click()
  await request(page).fill(message)
  await send(page)
  await answered(page).last().getByRole('link', { name: 'Open the result' }).click()
}

async function pick(page: Page, filter: string, option: string) {
  await page.getByRole('combobox', { name: filter }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

async function pickRequester(page: Page, search: string, option: string) {
  await page.getByRole('combobox', { name: 'Requester' }).click()
  await page.getByRole('combobox', { name: 'Search…' }).fill(search)
  await page.getByRole('option', { name: option, exact: true }).click()
}

test.describe('with a large team', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock.team', 'large'))
    await page.goto('/lookups')
    await expect(page.getByRole('heading', { level: 1, name: greeting })).toBeVisible()
  })

  test('the requester list shows the contacts before the whole team is loaded', async ({
    page,
  }) => {
    await page.getByRole('combobox', { name: 'Requester' }).click()
    const team = page.getByRole('group', { name: 'Team' })
    const contacts = page.getByRole('group', { name: 'WhatsApp contacts' })
    const more = team.getByRole('option', { name: 'Show more' })

    await expect(team.getByRole('option')).toHaveCount(21)
    await expect(contacts.getByRole('option')).toHaveCount(20)
    await expect(contacts.getByRole('option', { name: 'Show more' })).toHaveCount(0)

    await more.click()
    await expect(team.getByRole('option')).toHaveCount(34)
    await expect(more).toHaveCount(0)
    await expect(team.getByRole('option', { name: 'Sarah Collins' })).toBeAttached()
    await expect(contacts.getByRole('option')).toHaveCount(20)

    await page.getByRole('listbox').hover()
    await expect(async () => {
      await page.mouse.wheel(0, 2000)
      await expect(contacts.getByRole('option')).toHaveCount(24, { timeout: 500 })
    }).toPass()

    await page.getByRole('combobox', { name: 'Search…' }).fill('colleague 3')
    await expect(team.getByRole('option')).toHaveCount(1)
    await page.getByRole('option', { name: 'Colleague 30' }).click()
    await expect(page.getByRole('combobox', { name: 'Requester' })).toHaveText('Colleague 30')
  })
})

test.describe('as the owner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lookups')
    await expect(page.getByRole('heading', { level: 1, name: greeting })).toBeVisible()
  })

  test('shows the owner the searches of the last 30 days and who searches most', async ({
    page,
  }) => {
    await expect(page.getByText('Searches · last 30 days')).toBeVisible()
    await expect(page.getByText('+200% vs the previous 30 days')).toBeVisible()
    await expect(page.getByText('Completed · last 30 days')).toBeVisible()
    await expect(page.getByText('Failed · last 30 days')).toBeVisible()

    await page.getByRole('link', { name: 'Oakfield Garage' }).click()
    await expect(page).toHaveURL('/lookups?searcherType=contact&searcherId=1')
    await expect(page.getByRole('combobox', { name: 'Requester' })).toHaveText('Oakfield Garage')
  })

  test('shows the searches of the company, newest first, by page', async ({ page }) => {
    await expect(page.getByText('24 searches')).toBeVisible()
    await expect(queue(page).getByRole('row')).toHaveCount(21)
    await expect(queue(page).getByRole('row').nth(1)).toContainText(
      /GH482KL.*Searching.*Web.*Julia Bennett/
    )
    await expect(queue(page).getByRole('row').nth(2)).toContainText(
      /FT915ZR.*Oil filter.*Volkswagen Golf VII 2\.0 TDI.*Done.*WhatsApp.*Oakfield Garage/
    )

    await page.getByRole('link', { name: 'Next' }).click()
    await expect(page).toHaveURL('/lookups?page=2')
    await expect(queue(page).getByRole('row')).toHaveCount(5)
  })

  test('filters the searches by requester', async ({ page }) => {
    await pickRequester(page, 'oak', 'Oakfield Garage')

    await expect(page).toHaveURL('/lookups?searcherType=contact&searcherId=1')
    await expect(page.getByText('7 searches')).toBeVisible()
    for (const row of await queue(page).getByRole('row').all()) {
      await expect(row).toContainText(/Requester|Oakfield Garage/)
    }

    await pickRequester(page, 'elm', 'Elm Street Garage')
    await expect(page.getByText('No searches match the filters')).toBeVisible()

    await page.getByRole('link', { name: 'Clear filters' }).click()
    await expect(page).toHaveURL('/lookups')
    await expect(page.getByText('24 searches')).toBeVisible()
  })

  test('the requester list loads the team and the contacts, then more contacts while scrolling', async ({
    page,
  }) => {
    await page.getByRole('combobox', { name: 'Requester' }).click()
    const options = page.getByRole('option')
    await expect(options.first()).toHaveText('Everyone')
    await expect(page.getByRole('option', { name: 'Julia Bennett' })).toBeVisible()
    await expect(options).toHaveCount(25)
    await expect(page.getByRole('option', { name: 'Show more' })).toHaveCount(0)

    await page.getByRole('listbox').hover()
    await expect(async () => {
      await page.mouse.wheel(0, 400)
      await expect(options).toHaveCount(29, { timeout: 500 })
    }).toPass()
    await expect(page.getByRole('option', { name: 'Oakfield Garage' })).toBeAttached()

    await page.getByRole('combobox', { name: 'Search…' }).fill('nobody here')
    await expect(page.getByText('No results')).toBeVisible()
  })

  test('an action on the page keeps the scroll, another page starts from the top', async ({
    page,
  }) => {
    const scroll = () => page.evaluate(() => Math.round(window.scrollY))
    const scrollTo = async (target: Locator) => {
      await target.evaluate((element) =>
        window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top - 120)
      )

      return scroll()
    }

    await page.setViewportSize({ width: 1280, height: 480 })
    await page.goto('/lookups?page=2')
    await expect(page.getByText('21-24 of 24')).toBeVisible()

    const previous = page.getByRole('link', { name: 'Previous' })
    const paged = await scrollTo(previous)
    await previous.click()
    await expect(page.getByText('1-20 of 24')).toBeVisible()
    expect(paged).toBeGreaterThan(0)
    expect(await scroll()).toBe(paged)

    const filtered = await scrollTo(page.getByRole('combobox', { name: 'Status' }))
    await pick(page, 'Status', 'Done')
    await expect(page.getByText('17 searches')).toBeVisible()
    expect(filtered).toBeGreaterThan(0)
    expect(await scroll()).toBe(filtered)

    await page.getByRole('link', { name: 'Contacts', exact: true }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Contacts' })).toBeVisible()
    expect(await scroll()).toBe(0)

    await page.goBack()
    await expect(page.getByText('17 searches')).toBeVisible()
    await expect.poll(scroll).toBe(filtered)
  })

  test('filters the searches by status, period and channel together', async ({ page }) => {
    await pick(page, 'Status', 'Done')
    await expect(page).toHaveURL('/lookups?status=done')
    await expect(page.getByText('17 searches')).toBeVisible()

    await pick(page, 'Channel', 'WhatsApp')
    await pick(page, 'Period', 'Last 7 days')
    await expect(page).toHaveURL('/lookups?status=done&source=whatsapp&days=7')
    await expect(page.getByText('4 searches', { exact: true })).toBeVisible()
    for (const row of await queue(page).getByRole('row').all()) {
      await expect(row).toContainText(/Requester|Done.*WhatsApp/)
    }

    await pick(page, 'Status', 'All')
    await pick(page, 'Channel', 'All')
    await pick(page, 'Period', 'All time')
    await expect(page).toHaveURL('/lookups')
    await expect(page.getByText('24 searches')).toBeVisible()
  })

  test('goes back to the queue with its filters', async ({ page }) => {
    await pick(page, 'Status', 'Done')
    await expect(page).toHaveURL('/lookups?status=done')
    await queue(page).getByRole('link', { name: 'Open the search of FT915ZR' }).first().click()
    await expect(page).toHaveURL(/\/lookups\/\d+$/)

    await page.getByRole('link', { name: 'Back to searches' }).click()
    await expect(page).toHaveURL('/lookups?status=done')
    await expect(page.getByText('17 searches')).toBeVisible()
  })

  test('finds the searches of a plate or a VIN', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Plate or VIN' }).fill('wvwzzz')

    await expect(page).toHaveURL('/lookups?search=wvwzzz')
    await expect(page.getByText('5 searches')).toBeVisible()
    await expect(queue(page).getByRole('row').nth(1)).toContainText(/FT915ZR.*WVWZZZAUZHW204411/)

    await page.getByRole('searchbox', { name: 'Plate or VIN' }).fill('nothing')
    await expect(page.getByText('No searches match the filters')).toBeVisible()
    await page.getByRole('link', { name: 'Clear filters' }).click()
    await expect(page.getByRole('searchbox', { name: 'Plate or VIN' })).toBeEmpty()
    await expect(page.getByText('24 searches')).toBeVisible()
  })

  test('a new search opens its result', async ({ page }) => {
    await startSearch(page, 'pastiglie freno anteriori ab 123-cd')

    await expect(page).toHaveURL(/\/lookups\/\d+$/)
    await expect(page.getByRole('heading', { level: 2, name: 'AB123CD' })).toBeVisible()
    await expect(page.getByText('Fiat Panda 1.2')).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Front brake pads' })).toBeVisible()
    await expect(page.getByText('3 original parts · 4 aftermarket matches')).toBeVisible()
    await expect(page.getByText('Part requested')).toBeVisible()
    await expect(page.getByText('pastiglie freno anteriori')).toBeVisible()

    await page.getByRole('link', { name: 'Back to searches' }).click()
    await expect(answered(page)).toContainText('Found the parts')
    await page.goto('/lookups')
    await expect(page.getByText('25 searches')).toBeVisible()
    await expect(queue(page).getByRole('row').nth(1)).toContainText(/AB123CD.*Done.*Mark Reed/)
  })

  test('the result lists each unit of the catalog with its code, view and positions', async ({
    page,
  }) => {
    await startSearch(page, 'front brake pads AB123CD')
    const part = (code: string) => page.getByRole('listitem').filter({ hasText: `OEM ${code}` })

    await expect(page.getByRole('heading', { level: 3, name: '50110 Front brakes' })).toBeVisible()
    await expect(part('77367141')).toContainText('Pos. 4')
    await expect(part('77367141')).toContainText(/BREMBO.*P 23 141/)

    await expect(
      page.getByRole('heading', { level: 3, name: '50112 Front brake caliper' })
    ).toBeVisible()
    await expect(part('77365620')).toContainText(/Pos\. 6.*Brake pad fitting kit.*TRW.*PFK543/)
    await expect(part('46402682')).toContainText(/Pos\. 7.*Pad retaining spring/)
    await expect(part('46402682')).toContainText('No aftermarket matches.')

    const view = page.getByRole('link', { name: 'Exploded view of Front brake caliper' })
    const thumbnail = view.getByRole('img')
    await expect(view).toHaveAttribute('href', /\/exploded-view\.svg\?.*size=source$/)
    await expect(thumbnail).toHaveAttribute('src', /\/exploded-view\.svg\?.*size=250$/)
    await thumbnail.scrollIntoViewIfNeeded()
    await expect
      .poll(() => thumbnail.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0)

    const popup = page.waitForEvent('popup')
    await view.click()
    await expect(await popup).toHaveURL(/\/exploded-view\.svg\?.*size=source$/)
  })

  test('a category without parts for the vehicle says so', async ({ page }) => {
    await startSearch(page, 'filtro abitacolo AB123CD')

    await expect(page.getByRole('heading', { level: 2, name: 'Cabin filter' })).toBeVisible()
    await expect(page.getByText('0 original parts · 0 aftermarket matches')).toBeVisible()
    await expect(page.getByText('No parts found for this vehicle in this category.')).toBeVisible()
  })

  test('a plate the catalog does not know offers the same search again', async ({ page }) => {
    await startSearch(page, 'filtro olio XY123ZZ')

    await expect(page.getByRole('heading', { level: 2, name: 'Vehicle not found' })).toBeVisible()
    await page.getByRole('link', { name: 'Search again' }).click()

    await expect(page).toHaveURL(/\/lookups\/new\?/)
    await expect(request(page)).toHaveValue('XY123ZZ filtro olio')
  })

  test('a search by VIN finds the vehicle', async ({ page }) => {
    await startSearch(page, 'front brake pads wvwzzzauzhw204411')

    await expect(page).toHaveURL(/\/lookups\/\d+$/)
    await expect(page.getByRole('heading', { level: 2, name: 'WVWZZZAUZHW204411' })).toBeVisible()
    await expect(page.getByText('Volkswagen Golf VII 2.0 TDI')).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Front brake pads' })).toBeVisible()
  })

  test('a VIN the catalog does not know says the vehicle was not identified', async ({ page }) => {
    await startSearch(page, 'oil filter ZFA31200000000000')

    await expect(page.getByRole('heading', { level: 2, name: 'Vehicle not found' })).toBeVisible()
    await expect(page.getByText('Vehicle not identified')).toBeVisible()
    await expect(page.getByText('VIN', { exact: true })).toBeHidden()
  })

  test('a search that does not exist says so', async ({ page }) => {
    await page.goto('/lookups/9999')

    await expect(page.getByRole('heading', { level: 2, name: 'Page not found' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toBeHidden()
    await page.getByRole('link', { name: 'Back to searches' }).click()
    await expect(page).toHaveURL('/lookups')
  })

  test('a running search says it is still searching', async ({ page }) => {
    await queue(page).getByRole('link', { name: 'Open the search of GH482KL' }).first().click()

    await expect(
      page.getByRole('heading', { level: 2, name: 'Searching the catalog' })
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Search again' })).toHaveCount(0)
  })

  test('the contacts open the searches of each contact', async ({ page }) => {
    await page.goto('/contacts?page=2')
    await page.getByRole('link', { name: '412 searches by Oakfield Garage' }).click()

    await expect(page).toHaveURL('/lookups?searcherType=contact&searcherId=1')
    await expect(page.getByRole('combobox', { name: 'Requester' })).toHaveText('Oakfield Garage')
  })
})

test.describe('as a viewer', () => {
  test('the stats stay with the owner', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock.user', 'viewer'))
    await page.goto('/lookups')
    await expect(page.getByRole('heading', { level: 1, name: /Sarah Collins/ })).toBeVisible()

    await expect(page.getByText('24 searches')).toBeVisible()
    await expect(page.getByText('Searches · last 30 days')).toHaveCount(0)
    await expect(page.getByText('Top searchers')).toHaveCount(0)
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the sections are tabs under the header', async ({ page }) => {
    await page.goto('/lookups')
    const tabs = page.getByRole('navigation', { name: 'Sections' })

    await expect(tabs.getByRole('link', { name: 'Searches' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    await tabs.getByRole('link', { name: 'Contacts' }).click()
    await expect(page).toHaveURL('/contacts')
    await expect(tabs.getByRole('link', { name: 'Contacts' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  test('every search shows its status without scrolling sideways', async ({ page }) => {
    await page.goto('/lookups')

    await expect(page.getByRole('table')).toBeHidden()
    await expect(page.getByRole('link', { name: /^GH482KL.*Searching$/ })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })
})

test.describe('in an American browser', () => {
  test.use({ locale: 'en-US', timezoneId: 'America/New_York' })

  test('dates follow the country of the company, the words stay English', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-17T20:04:00Z'))
    await page.goto('/lookups')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Good afternoon, Mark Reed.' })
    ).toBeVisible()
    await expect(queue(page).getByRole('row').nth(1)).toContainText('17 Nov 2026, 15:03')

    await page.goto('/company')
    await page.getByRole('combobox', { name: 'Country' }).click()
    await page.getByRole('option', { name: 'United States' }).click()
    await expect(page.getByText('Country set to United States.')).toBeVisible()

    await page.goto('/lookups')
    await expect(queue(page).getByRole('row').nth(1)).toContainText(/Nov 17, 2026, 3:03\sPM/)
  })
})

test.describe('the new search chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lookups')
    await expect(page.getByRole('heading', { level: 1, name: greeting })).toBeVisible()
  })

  test('a new search opens a chat with the assistant', async ({ page }) => {
    await page.getByRole('link', { name: 'New search' }).first().click()

    await expect(page).toHaveURL('/lookups/new')
    await expect(
      page.getByRole('heading', { level: 1, name: 'What part do you need?' })
    ).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toContainText('New search')
    await expect(request(page)).toBeFocused()
    await expect(page.getByRole('textbox', { name: 'Registration plate' })).toHaveCount(0)
    await expect(answered(page)).toHaveCount(0)

    await page
      .getByRole('group', { name: 'Try' })
      .getByRole('button', { name: 'Oil filter and air filter for GH 482 KL' })
      .click()

    await expect(request(page)).toHaveValue('Oil filter and air filter for GH 482 KL')
    await expect(request(page)).toBeFocused()
  })

  test.describe('in the chat', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('link', { name: 'New search' }).first().click()
      await expect(request(page)).toBeVisible()
    })

    test('one message is read, searched and opened', async ({ page }) => {
      await request(page).fill('Front brake pads for AB 123 CD')
      await request(page).press('Enter')

      await expect(asked(page)).toHaveText('Front brake pads for AB 123 CD')
      await expect(request(page)).toHaveValue('')
      await expect(request(page)).toBeFocused()
      await expect(answered(page)).toContainText('AB123CD · Front brake pads')
      await expect(answered(page)).toContainText('Identified the vehicle')
      await expect(answered(page)).toContainText(
        'I found 1 category for Fiat Panda 1.2: Front brake pads.'
      )

      await answered(page).getByRole('link', { name: 'Open the result' }).click()
      await expect(page).toHaveURL(/\/lookups\/\d+$/)
      await expect(page.getByRole('heading', { level: 2, name: 'Front brake pads' })).toBeVisible()
    })

    test('the assistant asks for what is missing, and the answer completes the search', async ({
      page,
    }) => {
      await request(page).fill('Oil filter')
      await send(page)

      await expect(answered(page)).toContainText('No plate or VIN')
      await expect(answered(page)).toContainText(
        'I need the plate or the VIN of the vehicle: write it here, or attach a photo of the registration document.'
      )
      await expect(page.getByRole('link', { name: 'Open the result' })).toHaveCount(0)
      await expect(page).toHaveURL('/lookups/new')

      await request(page).fill('GH 482 KL')
      await send(page)

      await expect(asked(page)).toHaveCount(2)
      await expect(answered(page).last()).toContainText('GH482KL · Oil filter')
      await expect(answered(page).last()).toContainText(
        'I found 1 category for Fiat Panda 1.2 8V: Oil filter.'
      )
      await expect(page).toHaveURL(/\/lookups\/new\?lookupId=\d+$/)

      await request(page).fill('Air filter')
      await send(page)

      await expect(answered(page).last()).toContainText('No plate or VIN')
    })

    test('the page keeps the last search in its address, so a reload shows it again', async ({
      page,
    }) => {
      await request(page).fill('Oil filter for GH 482 KL')
      await send(page)
      await expect(answered(page)).toContainText('Found the parts')
      await expect(page).toHaveURL(/\/lookups\/new\?lookupId=\d+$/)

      await page.reload()

      await expect(asked(page)).toHaveText('GH482KL Oil filter')
      await expect(answered(page)).toContainText('GH482KL · Oil filter')
      await expect(answered(page)).toContainText('Fiat Panda 1.2 8V')
      await expect(answered(page)).toContainText('Found the parts')
    })

    test('a VIN in the message wins over the plate', async ({ page }) => {
      await request(page).fill('Oil filter, VIN ZFA31200003456789, plate DK 318 MP')
      await send(page)

      await expect(answered(page)).toContainText('ZFA31200003456789 · DK318MP · Oil filter')
      await expect(answered(page)).toContainText('Fiat Panda 1.2')
      await expect(answered(page)).not.toContainText('Renault Clio')
    })

    test('a photo of the registration document gives the plate', async ({ page }) => {
      await page.locator('input[type=file]').setInputFiles({
        name: 'libretto-FT915ZR.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('jpeg'),
      })
      await expect(page.getByRole('button', { name: 'Remove libretto-FT915ZR.jpg' })).toBeVisible()
      await request(page).fill('Oil filter')
      await send(page)

      await expect(asked(page).getByRole('img', { name: 'libretto-FT915ZR.jpg' })).toHaveCount(1)
      await expect(page.getByRole('button', { name: 'Remove libretto-FT915ZR.jpg' })).toHaveCount(0)
      await expect(answered(page)).toContainText('FT915ZR · Oil filter')
      await expect(answered(page)).toContainText('Volkswagen Golf VII 2.0 TDI')
    })

    test('an empty request asks for a message or a photo, Shift+Enter starts a new line', async ({
      page,
    }) => {
      await send(page)

      await expect(request(page)).toBeFocused()
      await expect(request(page)).toHaveAccessibleDescription(
        /Write the request, or attach a photo\./
      )

      await request(page).pressSequentially('Oil filter')
      await request(page).press('Shift+Enter')
      await request(page).pressSequentially('GH 482 KL')

      await expect(request(page)).toHaveValue('Oil filter\nGH 482 KL')
      await expect(request(page)).not.toHaveAccessibleDescription(/Write the request/)
      await expect(answered(page)).toHaveCount(0)
    })

    test('a request the assistant could not read can be sent again', async ({ page }) => {
      await request(page).fill('Oil filter for ER 503 ER')
      await send(page)

      await expect(answered(page)).toContainText('Could not read the request')
      await expect(answered(page)).toContainText(
        'The service is unavailable right now, try again later.'
      )
      await answered(page).getByRole('button', { name: 'Try again' }).click()

      await expect(answered(page)).toContainText('ER503ER · Oil filter')
      await expect(answered(page)).toContainText(
        'I found no vehicle for ER503ER. Check the plate, or write the VIN.'
      )
      await expect(answered(page).getByRole('button', { name: 'Try again' })).toHaveCount(0)
      await expect(asked(page)).toHaveCount(1)
    })
  })

  test('a failed search is offered again in the chat, as one message', async ({ page }) => {
    await page.goto('/lookups/new')
    await request(page).fill('Oil filter for XY 123 ZZ')
    await send(page)
    await expect(answered(page)).toContainText(
      'I found no vehicle for XY123ZZ. Check the plate, or write the VIN.'
    )
    await answered(page).getByRole('link', { name: 'Open the result' }).click()

    await page.getByRole('link', { name: 'Search again' }).click()

    await expect(page).toHaveURL(/\/lookups\/new\?/)
    await expect(request(page)).toHaveValue('XY123ZZ Oil filter')
  })

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('the chat fits the screen and keeps the request at hand', async ({ page }) => {
      await page.getByRole('link', { name: 'New search' }).first().click()
      await expect(request(page)).toBeFocused()
      expect(await page.evaluate(() => window.scrollY)).toBe(0)

      await request(page).fill('Front brake pads for AB 123 CD')
      await send(page)
      await expect(answered(page)).toContainText('Found the parts')
      await request(page).fill('Oil filter')
      await send(page)

      await expect(answered(page).last()).toContainText('No plate or VIN')
      await expect(request(page)).toBeInViewport()
      await expect(answered(page).last()).toBeInViewport()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        390
      )
    })
  })
})

async function chooseItaly(page: Page) {
  await page.goto('/company')
  await page.getByRole('combobox', { name: 'Country' }).click()
  await page.getByRole('option', { name: 'Italy' }).click()
  await expect(page.getByText('Country set to Italy.')).toBeVisible()
  await page.goto('/lookups')
  await expect(page.getByRole('heading', { level: 1, name: greeting })).toBeVisible()
}

test.describe('in an Italian company', () => {
  test.beforeEach(({ page }) => chooseItaly(page))

  test('the plates are written as in Italy, in the queue and in the search', async ({ page }) => {
    await queue(page).getByRole('link', { name: 'Open the search of FT 915 ZR' }).first().click()

    await expect(page.getByRole('heading', { level: 2, name: 'FT 915 ZR' })).toBeVisible()
  })

  test('a plate searched as it is shown finds its searches', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Plate or VIN' }).fill('DK 318 MP')

    await expect(queue(page).getByRole('row').nth(1)).toContainText('DK 318 MP')
    await expect(
      queue(page)
        .getByRole('row')
        .filter({ hasNotText: /DK ?318 ?MP/ })
    ).toHaveCount(1)
  })

  test('the plate of a contact search is written as the country of its number', async ({
    page,
  }) => {
    const search = page.getByRole('searchbox', { name: 'Plate or VIN' })

    await search.fill('DK318MP')
    await expect(queue(page).getByRole('row', { name: /Capitol Auto Care/ })).toContainText(
      'DK318MP'
    )
    await expect(
      queue(page)
        .getByRole('row', { name: /Baker and Sons Motors/ })
        .first()
    ).toContainText('DK 318 MP')
  })
})
