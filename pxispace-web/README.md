# PXI Public Events Website

A Next.js web application showcasing public PXI events and albums with a modern neon/purple design inspired by portalys.io and the original PXI brand aesthetic.

## Features

- 🎨 Modern neon-themed UI with custom Tailwind configuration
- 📱 Fully responsive design with mobile navigation
- 🗄️ Real-time data from Convex backend (shared with PXI Studio mobile app)
- 🎫 Public events listing with live/upcoming/memory status
- 🔗 Deep linking to mobile app with invite codes
- 📊 QR code generation for easy event joining
- 🎬 Interactive carousel for app screenshots
- 📄 Static pages for Help, Privacy, and Terms

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS with custom PXI theme
- **Database**: Convex (shared deployment with PXI Studio)
- **UI Components**: Custom components with neon effects
- **Icons**: Lucide React
- **QR Codes**: qrcode.react
- **Carousel**: Embla Carousel with Autoplay

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Access to the PXI Convex deployment

### Installation

1. Clone the repository or navigate to the project:
```bash
cd pxispace-web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example env file
cp .env.local.example .env.local
```

4. Edit `.env.local` and add your Convex URL:
```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_APP_URL=https://pxispace.com
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
pxispace-web/
├── app/                    # Next.js App Router pages
│   ├── album/[id]/        # Deep link route (redirects to mobile app)
│   ├── events/[id]/       # Event detail page
│   ├── help/              # Help & Support page
│   ├── privacy/           # Privacy Policy page
│   ├── terms/             # Terms & Conditions page
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   ├── providers.tsx      # Convex provider setup
│   └── globals.css        # Global styles & PXI theme
├── components/            # Reusable React components
│   ├── AlbumCard.tsx     # Event card component
│   ├── FeatureCard.tsx   # Feature showcase card
│   ├── Footer.tsx        # Site footer
│   ├── GlowBar.tsx       # Decorative glow separator
│   ├── Navbar.tsx        # Navigation with mobile menu
│   ├── QRCodeDisplay.tsx # QR code generator
│   └── StatusBadge.tsx   # Event status indicator
├── convex/               # Convex queries
│   └── albums.ts         # Public album queries
└── public/               # Static assets
    └── assets/           # Images, videos, icons
```

## Pages

### Home (`/`)
- Hero section with PXI branding
- About section
- Features grid with 3 cards
- Public events section (fetches from Convex)
- App screenshots carousel
- CTA buttons

### Event Detail (`/events/[id]`)
- Album cover and details
- Status badge (Live/Upcoming/Memory)
- Join options:
  - Manual code entry
  - "Open in App" button
  - Share invite link
  - QR code display

### Deep Link (`/album/[id]`)
- Automatic redirect to mobile app
- Fallback to App Store/TestFlight if app not installed
- Handles invite token parameter

### Help (`/help`)
- FAQ section
- Contact support
- Troubleshooting guides
- Quick links

### Privacy (`/privacy`)
- Privacy policy content

### Terms (`/terms`)
- Terms & conditions content

## Convex Queries

The app uses two main queries from `convex/albums.ts`:

- `listPublicAlbums`: Fetches all albums where `isPublic === true`
- `getPublicAlbumById`: Fetches a single public album with invite token

These queries share the same Convex deployment as the PXI Studio mobile app.

## Styling

The app uses a custom Tailwind configuration with PXI brand colors:

- **Violet**: `#a78bfa`
- **Violet Strong**: `#8b5cf6`
- **Ink**: `#0b0614`
- **Neon Purple**: `#d8c9ff`
- **Neon Light**: `#cbb3ff`

Custom CSS classes for neon effects:
- `.title-neon` - Neon glow for titles
- `.kicker-neon` - Neon glow for subtitles
- `.text-glow` - General text glow effect
- `.btn-neon-outline` - Neon outline button
- `.btn-gradient` - Gradient button
- `.glass` - Glass morphism effect
- `.card-hover` - Card hover animation

## Deep Linking

The app supports deep linking to the PXI Studio mobile app using the custom URL scheme:

```
pxistudio://album/[albumId]?invite=[inviteToken]
```

If the app is not installed, users are redirected to TestFlight.

## Deployment

The app is ready to deploy to:
- Vercel (recommended for Next.js)
- Netlify
- Any platform supporting Next.js

### Environment Variables for Production

Make sure to set these in your hosting platform:
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_APP_URL`

## License

© 2024 PXI Labs LLC — Texas
