import { revalidateTag } from 'next/cache'
import { getExtendedMarket } from '@play-money/api-helpers/client'
import { MarketIrlPage } from '@play-money/markets/components/MarketIrlPage'
import { ExtendedMarket } from '@play-money/markets/types'

export default async function AppPostsSlugPage({ params }: { params: { marketId: string } }) {
  const marketRes = await getExtendedMarket({ marketId: params.marketId })
  const market: ExtendedMarket = marketRes.data

  // eslint-disable-next-line @typescript-eslint/require-await -- Next requires this to be async since its SSR
  const handleRevalidate = async () => {
    'use server'
    revalidateTag(`market:${params.marketId}`)
  }

  return <MarketIrlPage market={market} onRevalidate={handleRevalidate} renderActivitiy={null} />
}
