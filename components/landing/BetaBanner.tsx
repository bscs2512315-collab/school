import { SITE } from "@/lib/site";

const TICKER_COPIES = [0, 1, 2] as const;

function TickerSegment() {
  return (
    <span className="flex items-center gap-8 pe-8">
      <span className="whitespace-nowrap text-xs font-medium text-primary-foreground sm:text-sm">
        {SITE.betaBanner}
      </span>
      <span className="text-primary-foreground/70">●</span>
    </span>
  );
}

export function BetaBanner() {
  return (
    <div className="bg-primary py-2">
      <p className="sr-only motion-reduce:not-sr-only motion-reduce:block motion-reduce:px-4 motion-reduce:text-center motion-reduce:text-xs motion-reduce:font-medium motion-reduce:leading-relaxed motion-reduce:text-primary-foreground">
        {SITE.betaBanner}
      </p>
      <div className="relative overflow-hidden motion-reduce:hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-primary to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-primary to-transparent" />
        <div className="landing-news-ticker flex w-max" aria-hidden>
          <div className="flex">
            {TICKER_COPIES.map((copy) => (
              <TickerSegment key={`a-${copy}`} />
            ))}
          </div>
          <div className="flex">
            {TICKER_COPIES.map((copy) => (
              <TickerSegment key={`b-${copy}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
