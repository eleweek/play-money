import { faker } from '@faker-js/faker'
import _ from 'lodash'
import { Market, User } from './zod'

export function mockUser(overrides?: Partial<User>): User {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  return {
    id: faker.string.uuid(),
    username: faker.internet.userName({ firstName, lastName }),
    displayName: faker.person.fullName({ firstName, lastName }),
    email: faker.internet.email({ firstName, lastName }),
    avatarUrl: faker.helpers.maybe(faker.image.avatar) ?? null,
    bio: faker.helpers.maybe(faker.person.bio) ?? null,
    twitterHandle: faker.helpers.maybe(faker.internet.userName, { probability: 0.3 }) ?? null,
    discordHandle: faker.helpers.maybe(faker.internet.userName, { probability: 0.3 }) ?? null,
    website: faker.helpers.maybe(faker.internet.domainName, { probability: 0.3 }) ?? null,
    emailVerified: faker.date.past(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    isAMM: false,
    ...overrides,
  }
}

export function mockMarket(overrides?: Partial<Market>): Market {
  const question = faker.lorem.sentence()
  const description = faker.lorem.paragraph()
  const closeDate = faker.date.future()
  return {
    id: faker.string.uuid(),
    question,
    description,
    slug: faker.helpers.slugify(question),
    closeDate,
    resolvedAt: faker.helpers.maybe(faker.date.past, { probability: 0.3 }) ?? null,
    createdBy: faker.string.uuid(),
    ammId: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }
}
