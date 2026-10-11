import { Photo } from '@/components/marketing/Photo';
import { PHOTOS } from '@/components/marketing/photos';
import { HeroTicket } from './HeroTicket';
import { ShareBubble } from './ShareBubble';
import { VerticalTape } from './VerticalTape';

/**
 * The hero's picture of a job: two tradeswomen on site with a tape measure down the side, the
 * WhatsApp message that carried the quote (from sm) and the quote itself, stamped Accepted.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto h-[30rem] w-full max-w-[36rem] animate-fade-in-up [animation-delay:120ms] sm:h-[40rem]">
      <div className="absolute top-6 right-0 bottom-3 w-[84%] overflow-hidden rounded-xl sm:top-[3.25rem] sm:bottom-5 sm:w-[81%] sm:rounded-[1.125rem]">
        {/* A 3:2 photo in a portrait box: it renders about 1.8x wider than the box. */}
        <Photo
          photo={PHOTOS.wallCheck}
          sizes="(min-width: 640px) 860px, 150vw"
          className="h-full object-[44%_50%]"
          eager
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-b from-transparent from-55% to-navy/35"
        />
      </div>
      <VerticalTape className="absolute top-16 -right-1 h-[17rem] sm:top-[6.5rem] sm:-right-[15px] sm:h-[29.375rem]" />
      <ShareBubble className="absolute top-0 left-0 z-[2] hidden w-[17.5rem] sm:block" />
      <HeroTicket className="absolute bottom-0 left-0 z-[2] w-[20rem] max-w-[92%] -rotate-3 sm:-left-3 sm:w-[21rem] sm:max-w-none" />
    </div>
  );
}
