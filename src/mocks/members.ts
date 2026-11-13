import { getGetApiV1WorkspaceMembersMockHandler } from '@/core/api/endpoints/members/members.msw'
import type { GetApiV1WorkspaceMembers200, WorkspaceMemberObject } from '@/core/api/models'
import { DEFAULT_PER_PAGE, MAX_PER_PAGE } from '@/core/pagination'
import { team } from '@/mocks/auth'
import { checkedPage, daysAgo, type Member, page, setting } from '@/mocks/data'
import { rejected } from '@/mocks/errors'
import { isRole } from '@/modules/workspaces/core/role'

const toObject = ({ id, userId, role, createdAt, user }: Member): WorkspaceMemberObject => ({
  id: Number(id),
  userId: Number(userId),
  role,
  name: user.name || user.email,
  email: user.email,
  image: user.image ?? null,
  createdAt,
})

const LARGE_TEAM = 30

function colleagues(organizationId: string): Member[] {
  return Array.from({ length: setting('team') === 'large' ? LARGE_TEAM : 0 }, (_, index) => {
    const id = String(500 + index)
    const name = `Colleague ${String(index + 1).padStart(2, '0')}`
    const user = { id, name, email: `colleague.${index + 1}@redwoodparts.com` }

    return { id, organizationId, userId: id, role: 'viewer', createdAt: daysAgo(30), user }
  })
}

const byName = (a: WorkspaceMemberObject, b: WorkspaceMemberObject) =>
  a.name.toLowerCase().localeCompare(b.name.toLowerCase()) || a.id - b.id

export const memberMocks = [
  getGetApiV1WorkspaceMembersMockHandler(async ({ request }) => {
    const known = team()
    const members = [...known, ...colleagues(known[0]?.organizationId ?? '')]
    const query = new URL(request.url).searchParams
    const roles = query.getAll('role[]')
    roles.forEach((role, index) => isRole(role) || rejected(`role.${index}`, 'enum'))
    const currentPage = checkedPage(query, 'page', 1)
    const perPage = checkedPage(query, 'perPage', DEFAULT_PER_PAGE, MAX_PER_PAGE)
    const search = query.get('search')?.trim().toLowerCase()

    const matching = members
      .map(toObject)
      .filter(({ role }) => roles.length === 0 || roles.includes(role))
      .filter(
        ({ name, email }) =>
          !search || [name, email].some((value) => value.toLowerCase().includes(search))
      )
      .sort(byName)

    return page(matching, currentPage, perPage) satisfies GetApiV1WorkspaceMembers200
  }),
]
