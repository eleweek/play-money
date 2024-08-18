import Decimal from 'decimal.js'
import '@play-money/config/jest/jest-setup'
import { mockAccount, mockMarket, mockMarketOption } from '@play-money/database/mocks'
import { createTransaction } from '@play-money/finance/lib/createTransaction'
import { getBalances, getAssetBalance, NetBalance } from '@play-money/finance/lib/getBalances'
import { getHouseAccount } from '@play-money/finance/lib/getHouseAccount'
import { getUserPrimaryAccount } from '@play-money/users/lib/getUserPrimaryAccount'
import { createMarketBuyTransaction } from './createMarketBuyTransaction'
import { getMarket } from './getMarket'
import { getMarketAmmAccount } from './getMarketAmmAccount'
import { getMarketClearingAccount } from './getMarketClearingAccount'
import { getMarketOption } from './getMarketOption'

jest.mock('@play-money/finance/lib/getHouseAccount', () => ({ getHouseAccount: jest.fn() }))
jest.mock('./getMarketAmmAccount', () => ({ getMarketAmmAccount: jest.fn() }))
jest.mock('./getMarketClearingAccount', () => ({ getMarketClearingAccount: jest.fn() }))
jest.mock('@play-money/users/lib/getUserPrimaryAccount', () => ({ getUserPrimaryAccount: jest.fn() }))
jest.mock('./getMarketOption', () => ({ getMarketOption: jest.fn() }))
jest.mock('@play-money/finance/lib/createTransaction', () => ({ createTransaction: jest.fn() }))
jest.mock('@play-money/finance/lib/getBalances', () => ({ getBalances: jest.fn(), getAssetBalance: jest.fn() }))
jest.mock('./getMarket', () => ({ getMarket: jest.fn() }))

describe('createMarketBuyTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call createTransaction with approperate transactionItems', async () => {
    jest.mocked(getAssetBalance).mockImplementation(async ({ accountId }) => {
      if (accountId === 'user-1-account') {
        return {
          accountId,
          assetType: 'CURRENCY',
          assetId: 'PRIMARY',
          amount: new Decimal(50),
          subtotals: {},
        }
      }
      return {} as NetBalance
    })

    jest.mocked(getHouseAccount).mockResolvedValue(mockAccount({ id: 'HOUSE' }))
    jest.mocked(getUserPrimaryAccount).mockResolvedValue(mockAccount({ id: 'user-1-account' }))
    jest.mocked(getMarketAmmAccount).mockResolvedValue(mockAccount({ id: 'amm-1-account' }))
    jest.mocked(getMarketClearingAccount).mockResolvedValue(mockAccount({ id: 'EXCHANGER' }))
    jest.mocked(getMarketOption).mockResolvedValue(mockMarketOption({ id: 'option-1', currencyCode: 'YES' }))

    jest.mocked(getMarket).mockResolvedValue({
      ...mockMarket(),
      options: [
        mockMarketOption({ id: 'option-1', liquidityProbability: new Decimal(0.5) }),
        mockMarketOption({ id: 'option-2', liquidityProbability: new Decimal(0.5) }),
      ],
    })

    jest.mocked(getBalances).mockImplementation(async ({ accountId }) => {
      if (accountId === 'amm-1-account') {
        return [
          {
            accountId,
            assetType: 'MARKET_OPTION',
            assetId: 'option-1',
            amount: new Decimal(100),
            subtotals: {},
          },
          {
            accountId,
            assetType: 'MARKET_OPTION',
            assetId: 'option-2',
            amount: new Decimal(300),
            subtotals: {},
          },
        ]
      }
      return []
    })

    await createMarketBuyTransaction({
      userId: 'user-1',
      amount: new Decimal(50),
      marketId: 'market-1',
      optionId: 'option-1',
    })

    expect(createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionItems: expect.arrayContaining([
          {
            amount: new Decimal(-50),
            currencyCode: 'PRIMARY',
            accountId: 'user-1-account',
          },
          {
            amount: new Decimal(50),
            currencyCode: 'PRIMARY',
            accountId: 'EXCHANGER',
          },
          {
            amount: new Decimal(-50),
            currencyCode: 'YES',
            accountId: 'EXCHANGER',
          },
          {
            amount: new Decimal(-50),
            currencyCode: 'NO',
            accountId: 'EXCHANGER',
          },
          {
            amount: new Decimal(50),
            currencyCode: 'YES',
            accountId: 'user-1-account',
          },
          {
            amount: new Decimal(50),
            currencyCode: 'NO',
            accountId: 'user-1-account',
          },
          {
            amount: new Decimal(-50),
            currencyCode: 'YES',
            accountId: 'user-1-account',
          },
          {
            amount: new Decimal(-50),
            currencyCode: 'NO',
            accountId: 'user-1-account',
          },
          {
            amount: new Decimal(50),
            currencyCode: 'YES',
            accountId: 'amm-1-account',
          },
          {
            amount: new Decimal(50),
            currencyCode: 'NO',
            accountId: 'amm-1-account',
          },
          {
            currencyCode: 'YES',
            accountId: 'amm-1-account',
            amount: expect.closeToDecimal(-64.29),
          },
          {
            currencyCode: 'YES',
            accountId: 'user-1-account',
            amount: expect.closeToDecimal(64.29),
          },
        ]),
      })
    )
  })
})