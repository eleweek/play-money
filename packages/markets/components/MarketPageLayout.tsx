'use client'

import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import React from 'react'
import { useTrackResourceViewed } from '@play-money/notifications/hooks/useTrackResourceViewed'
import { SidebarReferralAlert } from '@play-money/referrals/components/SidebarReferralAlert'
import { Tabs, TabsList, TabsTrigger } from '@play-money/ui/tabs'
import { SelectedItemsProvider } from '../../ui/src/contexts/SelectedItemContext'
import { ExtendedMarket } from '../types'
import { MarketPageSidebar } from './MarketPageSidebar'
import { SidebarProvider } from './SidebarContext'

export function QRCode(props: { url: string; className?: string; width?: number; height?: number }) {
  const { url, className, width = 200, height = 200 } = props

  // url-encode the url
  const urlEncoded = encodeURIComponent(url)

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${width}x${height}&data=${urlEncoded}`

  return (
    <div className="aspect-square">
      <img src={qrUrl} width={width} height={height} className={className} alt={`QR code to ${urlEncoded}`} />
    </div>
  )
}

export function MarketPageLayout({
  market,
  children,
  onRevalidate,
}: {
  market: ExtendedMarket
  children: React.ReactNode
  onRevalidate: () => Promise<void>
}) {
  const router = useRouter()
  const pathname = usePathname()

  const createdOrderOptions = market.options.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const initialTab = pathname.includes('/trades')
    ? 'trades'
    : pathname.includes('/positions')
      ? 'positions'
      : pathname.includes('/comments')
        ? 'comments'
        : pathname.includes('/liquidity')
          ? 'liquidity'
          : 'overview'

  useTrackResourceViewed({ resourceId: market.id, resourceType: 'MARKET' })

  const handleTabChange = (value: string) => {
    if (value === 'overview') {
      router.push(`/questions/${market.id}/${market.slug}`)
    } else if (value === 'trades') {
      router.push(`/questions/${market.id}/${market.slug}/trades`)
    } else if (value === 'positions') {
      router.push(`/questions/${market.id}/${market.slug}/positions`)
    } else if (value === 'comments') {
      router.push(`/questions/${market.id}/${market.slug}/comments`)
    } else if (value === 'liquidity') {
      router.push(`/questions/${market.id}/${market.slug}/liquidity`)
    }
  }

  const irl = pathname.endsWith('/irl')

  return (
    <SelectedItemsProvider initialValue={[createdOrderOptions[0]?.id]}>
      <SidebarProvider>
        <main className="mx-auto flex w-full max-w-screen-lg flex-1 flex-col gap-8 md:flex-row">
          <div className="flex-1 space-y-2">
            {!irl && (
              <Tabs defaultValue={initialTab} className="w-[400px]" onValueChange={handleTabChange}>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                  <TabsTrigger value="positions">Positions</TabsTrigger>
                  <TabsTrigger value="trades">Trades</TabsTrigger>
                  <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            {children}
          </div>

          {!irl ? (
            <div className="w-full space-y-8 md:w-80">
              <SidebarReferralAlert />
              <MarketPageSidebar market={market} onTradeComplete={onRevalidate} />
            </div>
          ) : (
            <div className="w-full space-y-8 md:w-80">
              <QRCode url={`${window.location.origin}/questions/${market.id}/${market.slug}`} />
            </div>
          )}
        </main>
      </SidebarProvider>
    </SelectedItemsProvider>
  )
}
