import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  Globe,
  Instagram,
  Play,
  Scan,
  Smartphone,
} from 'lucide-react';
import { PXI_APP_STORE_URL, PXI_PLAY_STORE_URL } from '@/lib/appStoreLinks';
import { singleEventMapEmbedSrc } from '@/lib/eventMapEmbed';

const DEMO = '/demo_files';

const HERO_BG = `${DEMO}/69a4f78df6bd7d2646a4e6cb`;
const POSTER = `${DEMO}/69a4f78df6bd7d2646a4e6cb`;
const ORG_AVATAR = `${DEMO}/4e6f2a7e-846e-4d89-87e3-a8d3a696a4d6.jpg`;
const ORG_HREF = 'https://posh.vip/g/elevatesocial';

/** Academy area — 33 Dunster St, Cambridge, MA */
const DEMO_VENUE_LAT = 42.37304;
const DEMO_VENUE_LON = -71.11887;
const DEMO_MAP_SRC = singleEventMapEmbedSrc(DEMO_VENUE_LAT, DEMO_VENUE_LON);

const GUESTLIST_AVATARS = [
  `${DEMO}/69a4f7c0117f9d6118607140`,
  `${DEMO}/69a4f900117f9d611860acb0`,
  `${DEMO}/69a4f88f117f9d61186099c2`,
];

const lineup = [
  {
    name: 'Dj Hol Up',
    href: 'https://www.instagram.com/djholup_/',
    image: `${DEMO}/69a4f7c0117f9d6118607140`,
    alt: 'Dj Hol Up profile image',
  },
  {
    name: 'SuperSmashBroz',
    href: 'https://www.instagram.com/mez.wav',
    image: `${DEMO}/69a4f900117f9d611860acb0`,
    alt: 'SuperSmashBroz profile image',
  },
  {
    name: 'King Collins',
    href: 'https://www.instagram.com/thekingcollins/?hl=en',
    image: `${DEMO}/69a4f88f117f9d61186099c2`,
    alt: 'King Collins profile image',
  },
  {
    name: 'Cryptocastro',
    href: 'https://www.instagram.com/cryptocastro/',
    image: `${DEMO}/671854afc0bd2dd4d1fbb401`,
    alt: 'Cryptocastro profile image',
  },
];

const ACCENT = '#c44d54';

/** Verified badge — EventPageOrganizerCard */
function OrganizerVerifiedBadge() {
  return (
    <span className="relative ml-1 inline-flex shrink-0 items-center justify-center">
      <svg
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-3 text-zinc-200 sm:size-4 md:size-3"
        aria-hidden
      >
        <title>Verified background</title>
        <g clipPath="url(#elevate-verify-bg)">
          <path
            d="M0.0389957 8.447C0.03125 8.17642 0.03125 7.91535 0.03125 7.63963C0.187356 7.04267 0.659409 6.73052 1.09292 6.3863C1.2233 6.28278 1.35402 6.18065 1.47728 6.06803C1.58377 5.97073 1.60012 5.86012 1.57705 5.72852C1.52746 5.44562 1.42451 5.17744 1.35363 4.90043C1.26008 4.53483 1.19867 4.16635 1.27015 3.79016C1.36257 3.30376 1.65498 2.98484 2.11364 2.80996C2.40923 2.69726 2.71622 2.65023 3.0303 2.6519C3.32209 2.65344 3.61165 2.63737 3.90038 2.59357C4.01637 2.57598 4.08413 2.51526 4.13576 2.41456C4.28853 2.11659 4.36892 1.79119 4.49616 1.48353C4.60222 1.22709 4.72007 0.977628 4.90424 0.768737C5.36512 0.246015 5.98809 0.132765 6.64705 0.448237C6.94363 0.590226 7.21602 0.773022 7.48104 0.966417C7.60349 1.05578 7.73517 1.12807 7.86883 1.19845C7.98018 1.25708 8.08273 1.25158 8.19598 1.19784C8.49926 1.05392 8.75252 0.833447 9.03648 0.660078C9.29581 0.501755 9.55957 0.35928 9.8624 0.304318C10.4341 0.200566 10.8813 0.406094 11.2279 0.856621C11.4866 1.19288 11.6075 1.59437 11.751 1.98436C11.8067 2.13594 11.8601 2.28746 11.9355 2.43111C11.9828 2.5214 12.0476 2.5733 12.1498 2.59127C12.438 2.6419 12.7278 2.65375 13.0196 2.65178C13.3123 2.64981 13.5997 2.68897 13.8784 2.78424C14.4908 2.99361 14.8088 3.44332 14.8204 4.08889C14.8281 4.51917 14.7027 4.92021 14.5868 5.32471C14.5553 5.4348 14.5319 5.54717 14.4994 5.65624C14.4368 5.86591 14.5065 6.01781 14.6688 6.14847C14.8755 6.31477 15.0918 6.46852 15.2948 6.63964C15.5025 6.81474 15.6912 7.00634 15.8591 7.2203C15.9499 7.33595 15.9762 7.47236 16.0235 7.61547C16.0313 7.88606 16.0312 8.14713 16.0312 8.42284C15.8611 9.05915 15.3409 9.37446 14.8845 9.74486C14.7835 9.82679 14.6819 9.90705 14.5851 9.99445C14.478 10.0912 14.4624 10.2025 14.4855 10.3341C14.5351 10.617 14.638 10.8852 14.7089 11.1622C14.8024 11.5278 14.8638 11.8963 14.7923 12.2725C14.6998 12.7589 14.4074 13.0778 13.9487 13.2526C13.6531 13.3652 13.3461 13.4119 13.032 13.4107C12.7403 13.4095 12.4505 13.4196 12.1619 13.4686C12.0464 13.4882 11.9783 13.5474 11.9267 13.648C11.7739 13.946 11.6936 14.2714 11.5663 14.5791C11.4601 14.8355 11.3424 15.0849 11.1582 15.2939C10.6983 15.8154 10.0724 15.9292 9.41486 15.6139C9.11362 15.4694 8.83996 15.2789 8.56858 15.0857C8.54743 15.0707 8.52841 15.0525 8.50578 15.0395C8.00216 14.7492 8.06323 14.7213 7.50368 15.08C7.14516 15.3099 6.81172 15.5793 6.39589 15.7107C5.76545 15.9099 5.15459 15.6946 4.78788 15.1418C4.56942 14.8124 4.44283 14.4435 4.31103 14.0767C4.25461 13.9196 4.19826 13.7636 4.11878 13.6163C4.07607 13.5371 4.01634 13.4894 3.92645 13.4742C3.6799 13.4326 3.4325 13.4062 3.18192 13.4115C2.83148 13.4188 2.48696 13.3859 2.15321 13.2672C1.56753 13.0589 1.2552 12.6124 1.24198 11.9892C1.23274 11.5535 1.35776 11.1472 1.47587 10.7378C1.50183 10.6478 1.52167 10.5558 1.55217 10.4676C1.64264 10.2058 1.54683 10.0181 1.33548 9.86172C1.13496 9.71334 0.933493 9.5655 0.743038 9.40391C0.576125 9.26229 0.423366 9.10664 0.280405 8.94058C0.158658 8.79916 0.0821837 8.63836 0.0389957 8.447Z"
            fill="currentColor"
          />
        </g>
        <defs>
          <clipPath id="elevate-verify-bg">
            <rect width="16" height="16" fill="white" />
          </clipPath>
        </defs>
      </svg>
      <span className="absolute inset-0 bottom-0 right-0 flex items-center justify-end">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-3 text-white sm:size-4 md:size-3"
          aria-hidden
        >
          <title>Verified check</title>
          <g clipPath="url(#elevate-verify-check)">
            <path
              d="M8.74265 9.05515C8.37015 9.42708 8.00179 9.78762 7.64211 10.1566C7.41856 10.386 7.01284 10.4321 6.73733 10.1579C6.18754 9.61085 5.63405 9.06726 5.09358 8.51106C4.69739 8.10333 4.88341 7.60386 5.26515 7.43424C5.53012 7.3165 5.79546 7.37535 6.02734 7.60593C6.41856 7.99497 6.80746 8.38634 7.20573 8.78514C7.41627 8.57241 7.6233 8.36155 7.83214 8.15251C8.57902 7.40493 9.33013 6.66152 10.0715 5.90854C10.2901 5.68655 10.7187 5.64039 10.9806 5.89522C11.247 6.15434 11.2481 6.55889 10.9834 6.81897C10.2334 7.55599 9.49404 8.30379 8.74265 9.05515Z"
              fill="currentColor"
            />
          </g>
          <defs>
            <clipPath id="elevate-verify-check">
              <rect width="16" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </span>
    </span>
  );
}

function SectionDivider() {
  return <div className="h-px w-full bg-white/15" />;
}

export default function EventsNewDemoPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-white antialiased">
      <div className="fixed top-3 left-3 z-50">
        <Link
          href="/events-new"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-xs font-medium text-zinc-200 backdrop-blur-md hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          Events
        </Link>
      </div>

      <div className="relative">
        <div className="fixed inset-0 top-0 z-0 h-screen w-screen overflow-hidden bg-[#0a0a0a]">
          <div
            className="absolute inset-0 w-full opacity-100 transition-opacity duration-500 ease-in-out"
            style={{
              height: '33.33%',
              backgroundImage: `url("${HERO_BG}")`,
              backgroundPosition: '100% 5%',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              maskImage: 'linear-gradient(to bottom, #0a0a0a, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, #0a0a0a, transparent)',
            }}
          />
          <div className="absolute inset-0 backdrop-blur-md" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/40 to-[#0a0a0a]/90" />
        </div>

        <div className="relative z-10">
          <main className="mx-auto mt-2 flex min-h-screen w-full max-w-5xl flex-col justify-around px-3 pb-0 sm:px-6 md:mt-4 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:gap-8 2xl:max-w-6xl 2xl:gap-12">
            {/* Aside */}
            <div className="order-1 flex flex-col md:order-2 md:w-[330px] lg:w-[375px] 2xl:w-[400px]">
              <div className="relative top-0 mx-auto h-auto w-full max-w-[400px] md:sticky md:top-20">
                <div className="relative px-6 pb-6 md:px-0 md:pb-0">
                  <div className="relative w-full" style={{ paddingBottom: '125%' }}>
                    <div className="absolute inset-0 overflow-hidden rounded-xl bg-zinc-900">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img
                          alt="Elevate Social: Boston (3/27) flyer"
                          width={512}
                          height={640}
                          decoding="async"
                          className="h-full max-h-full w-full max-w-full object-cover transition-opacity duration-300"
                          src={POSTER}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 flex justify-end md:bottom-0 md:left-0 md:right-0">
                    <button
                      type="button"
                      className="m-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white shadow backdrop-blur-md transition hover:bg-black/70"
                      aria-label="Play"
                    >
                      <Play className="size-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                <div className="mt-6 hidden w-full flex-col items-center text-center md:flex">
                  <div className="space-y-6">
                    <h3 className="text-balance text-xl font-medium tracking-tight text-white">
                      Elevate Social: Boston (3/27)
                    </h3>
                    <div className="flex flex-col items-center">
                      <p className="text-base font-medium leading-6 text-zinc-200">Academy</p>
                      <p className="text-base font-medium leading-6 text-zinc-200">
                        Fri,&nbsp;Mar&nbsp;27&nbsp;at&nbsp;10:00&nbsp;PM (EDT)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 w-full px-6 md:px-0">
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-white shadow transition hover:opacity-90"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Get tickets
                  </button>
                </div>
              </div>
            </div>

            {/* Primary */}
            <div className="order-2 mb-0 mt-4 flex flex-col gap-4 border-t border-white/15 pt-2 md:order-1 md:mt-2 md:pt-0">
              <div className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <a
                    className="mt-1.5 flex flex-row items-start justify-start gap-2 p-0 hover:underline"
                    href={ORG_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="relative mt-0.5 flex size-5 shrink-0 overflow-hidden rounded-full">
                      <img className="size-full object-cover" alt="Elevate Social" src={ORG_AVATAR} />
                    </span>
                    <h2 className="text-base font-medium tracking-tight text-white">Elevate Social</h2>
                  </a>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <h1 className="text-balance text-2xl font-semibold tracking-tight text-white md:text-3xl">
                    Elevate Social: Boston (3/27)
                  </h1>
                  <p className="text-base font-medium leading-6 text-zinc-200">Academy</p>
                  <p className="text-base font-medium leading-6 text-zinc-200">Fri, Mar 27 at 10:00 PM (EDT)</p>
                  <p className="text-base leading-6 text-zinc-300">
                    Come join Elevate Social as we make our return to Boston
                  </p>
                </div>
              </div>

              {/* Guestlist */}
              <div className="group/guestlist flex w-full flex-col gap-4 pb-2 pt-2">
                <SectionDivider />
                <div className="flex flex-row items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-row items-center gap-3">
                    <div className="flex shrink-0 -space-x-2">
                      {GUESTLIST_AVATARS.map((src, i) => (
                        <span
                          key={src}
                          className="relative inline-flex size-8 overflow-hidden rounded-full border-2 border-[#0a0a0a] ring-1 ring-white/10"
                          style={{ zIndex: GUESTLIST_AVATARS.length - i }}
                        >
                          <img src={src} alt="" className="size-full object-cover" />
                        </span>
                      ))}
                    </div>
                    <p className="text-sm font-medium leading-5 text-zinc-200">
                      Kadija and <span className="text-white">220 </span>others going
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-7 shrink-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
                  >
                    <span className="hidden sm:inline">View guestlist</span>
                    <span className="sm:hidden">Guestlist</span>
                    <Scan className="size-4" style={{ color: ACCENT }} aria-hidden />
                  </button>
                </div>
              </div>

              {/* About */}
              <div className="flex flex-col gap-6">
                <SectionDivider />
                <h2 className="font-semibold text-white">About this event</h2>
                <div className="flex flex-col">
                  <div className="relative overflow-hidden">
                    <section
                      className="max-w-none text-base leading-relaxed text-white/80 transition-all duration-300 ease-in-out [&_p]:mt-0 [&_p+p]:mt-4 [&_strong]:font-semibold [&_strong]:text-white"
                      style={{ height: 'auto', maskImage: 'none' }}
                    >
                      <p>
                        On <strong>Friday, March 27</strong>, Elevate Social is back in Boston as we{' '}
                        <strong>celebrate the diaspora during Africa Business Conference weekend</strong>. Tap in for a night
                        of <strong>Hip Hop and sounds from around the world</strong>.
                      </p>
                      <p>
                        <strong>Hosted by:</strong> BVD Boston &amp; Gbedu Galore
                        <br />
                        <strong>Sounds by:</strong> SuperSmashBroz, CryptoCastro, King Collins, &amp; DJ Hol Up
                      </p>
                      <p>
                        <strong>NOTE:</strong> Tickets are non-refundable and the event is 21+
                      </p>
                      <p>
                        Elevate Social is a movement that promotes creativity, collaboration, and empowerment through
                        elevated social experiences. Our community is driven by its diverse members, shaped through curated
                        events, and strengthened through strategic partnerships — and it wouldn&apos;t be anything without
                        you. Come be part of the journey.
                      </p>
                    </section>
                  </div>
                </div>
              </div>

              {/* Lineup */}
              <div className="flex flex-col gap-8">
                <SectionDivider />
                <h3 className="text-base font-semibold tracking-tight text-white">Lineup</h3>
                <div className="relative overflow-hidden">
                  <div className="grid grid-cols-2 gap-6">
                    {lineup.map((item) => (
                      <div key={item.name} className="flex flex-col">
                        <div className="flex flex-col gap-2">
                          <div className="group relative aspect-square w-full overflow-hidden rounded-sm">
                            <a
                              target="_blank"
                              className="block h-full w-full"
                              href={item.href}
                              rel="noopener noreferrer"
                            >
                              <img
                                alt={item.alt}
                                loading="lazy"
                                width={400}
                                height={400}
                                decoding="async"
                                className="h-full w-full object-cover transition-all duration-200 ease-in-out"
                                src={item.image}
                              />
                              <div className="absolute inset-0 bg-black/0 transition-all duration-200 ease-in-out group-hover:bg-black/20" />
                            </a>
                          </div>
                          <div className="flex flex-col gap-1">
                            <a
                              target="_blank"
                              className="group inline-flex items-center gap-1 text-white transition-all duration-200 ease-in-out"
                              href={item.href}
                              rel="noopener noreferrer"
                            >
                              <h3 className="relative text-lg font-medium tracking-tight after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all after:duration-200 after:ease-in-out group-hover:after:w-full">
                                {item.name}
                              </h3>
                              <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity duration-200 ease-in-out group-hover:opacity-100" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex flex-col gap-4">
                <SectionDivider />
                <h3 className="text-base font-semibold tracking-tight text-white">Location</h3>
                {DEMO_MAP_SRC ? (
                  <div className="h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-zinc-900">
                    <iframe
                      title="Event location — Academy, Cambridge"
                      src={DEMO_MAP_SRC}
                      className="h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : null}
                <p className="text-sm text-zinc-400">33 Dunster St, Cambridge, MA 02138, USA</p>
              </div>

              {/* Hosted by — EventPageCard */}
              <div className="flex flex-col gap-4">
                <SectionDivider />
                <div className="rounded-xl bg-white/5 p-4 backdrop-blur-xl">
                  <div className="flex justify-between gap-4">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                      <p className="shrink-0 text-sm text-white/60">Hosted by</p>
                      <a
                        className="text-zinc-100 hover:underline"
                        href={ORG_HREF}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="inline-flex flex-wrap items-center text-sm leading-5 font-normal">
                          Elevate Social
                          <OrganizerVerifiedBadge />
                        </span>
                      </a>
                    </div>
                    <a
                      className="flex shrink-0 items-center gap-1 text-sm text-white/60 hover:underline"
                      href={ORG_HREF}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      More events
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </a>
                  </div>

                  <div className="mb-6 mt-10 flex flex-col items-center">
                    <a href={ORG_HREF} target="_blank" rel="noopener noreferrer">
                      <img
                        alt="Organization profile image for Elevate Social"
                        loading="lazy"
                        width={200}
                        height={200}
                        decoding="async"
                        className="h-52 w-52 rounded-full object-cover opacity-100 transition-opacity duration-300"
                        src={ORG_AVATAR}
                      />
                    </a>
                  </div>

                  <div className="mb-4 flex flex-col items-center gap-4">
                    <p className="text-center font-medium text-white/80">
                      <a
                        className="hover:underline"
                        href={ORG_HREF}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Elevate Social
                      </a>
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white/80">61 events</p>
                      <div className="h-4 w-px bg-zinc-500" />
                      <p className="text-sm text-white/80">19,791 attendees</p>
                    </div>
                    <div className="my-2 text-white/80">
                      <div className="flex gap-2">
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          href="https://www.instagram.com/elevatesocial"
                          className="text-white/80 transition hover:text-white"
                          aria-label="Elevate Social on Instagram"
                        >
                          <Instagram className="h-4 w-4" strokeWidth={2} />
                        </a>
                        <a
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          href="https://www.elevatesocial.club/"
                          className="text-white/80 transition hover:text-white"
                          aria-label="Elevate Social website"
                        >
                          <Globe className="h-4 w-4" strokeWidth={2} />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full border border-white/15 bg-black/50 px-4 py-2 text-sm font-medium whitespace-nowrap text-white shadow-sm outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/25"
                    >
                      Contact
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-20 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full border border-white/15 bg-black/50 px-4 py-2 text-sm font-medium whitespace-nowrap text-white shadow-sm outline-none transition duration-300 ease-in-out hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/25"
                    >
                      Follow
                    </button>
                  </div>
                </div>
              </div>

              {/* Get the app */}
              <div className="flex flex-col gap-6 pb-16">
                <SectionDivider />
                <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-8">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Smartphone className="size-8 text-zinc-400" aria-hidden />
                    <h5 className="text-center text-xl font-semibold text-white md:text-2xl">
                      Get the app for more features
                    </h5>
                    <p className="max-w-md text-sm text-zinc-400">
                      Check out faster, get tickets on your phone, and see guestlists &amp; updates — download the PXI app.
                    </p>
                  </div>
                  <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
                    <a
                      href={PXI_APP_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-black/40 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white/10 sm:flex-initial"
                    >
                      <Smartphone className="size-4" />
                      App Store
                    </a>
                    <a
                      href={PXI_PLAY_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-black/40 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white/10 sm:flex-initial"
                    >
                      <Smartphone className="size-4" />
                      Google Play
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
