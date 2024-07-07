import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { ActiveUserBalance } from '@play-money/accounts/components/ActiveUserBalance'
import { GlobalSearchTrigger } from '@play-money/search/components/GlobalSearchTrigger'
import { Badge } from '@play-money/ui/badge'
import { Button } from '@play-money/ui/button'
import { Sheet, SheetTrigger, SheetContent, SheetClose } from '@play-money/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@play-money/ui/tooltip'
import { cn } from '@play-money/ui/utils'
import { UserNav } from '@play-money/users/components/UserNav'

function MainNav({
  className,
  renderItemWrap = (children) => children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { renderItemWrap?: (children: React.ReactNode) => React.ReactNode }) {
  return (
    <nav className={cn('flex items-center text-sm', className)} {...props}>
      {renderItemWrap(
        <Link className="font-medium transition-colors hover:text-primary" href="/questions">
          Markets
        </Link>
      )}
      {renderItemWrap(
        <Link className="font-medium transition-colors hover:text-primary" href="/create-post">
          Create Market
        </Link>
      )}
    </nav>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="flex w-full flex-col justify-between border-b">
        <div className="flex h-16 items-center justify-between gap-4 px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="md:hidden" size="icon" variant="outline">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col gap-4">
                <span className="text-lg font-bold tracking-tight text-muted-foreground">PlayMoney</span>
                <GlobalSearchTrigger />
                <MainNav
                  className="flex flex-col items-start space-y-4 text-lg"
                  renderItemWrap={(child) => <SheetClose asChild>{child}</SheetClose>}
                />
              </div>
            </SheetContent>
          </Sheet>
          <Link className="flex items-center gap-2" href="/">
            <span className="text-lg font-bold tracking-tight text-muted-foreground">PlayMoney</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="hidden md:block" variant="outline">
                  ALPHA
                </Badge>
              </TooltipTrigger>
              <TooltipContent>All markets and balances are temporary</TooltipContent>
            </Tooltip>
          </Link>
          <MainNav className="hidden gap-6 md:flex" />

          <div className="ml-auto flex items-center space-x-4">
            <ActiveUserBalance />
            <GlobalSearchTrigger className="hidden md:flex" />
            <UserNav />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-screen-xl flex-1 space-y-4 p-4 md:p-8">{children}</div>
    </div>
  )
}
