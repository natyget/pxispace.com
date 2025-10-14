# PXI Public Events Website - Setup Guide

## 🚀 Quick Start

### 1. Configure Convex

**In the terminal that's asking for configuration:**
- Select **"choose an existing project"**
- Choose your PXIStudio Convex project (same deployment)

This will sync the schema and fix TypeScript errors.

### 2. Environment Variables

Create `.env.local`:
```bash
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_APP_URL=https://pxispace.com
```

Get your Convex URL from the PXIStudio project or Convex dashboard.

### 3. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000`

## ✨ What's New

### Enhanced Navbar
- Logo image with neon brand text
- Scroll-based style changes (border, shadow)
- Animated gradient underlines on hover
- Icons on CTA buttons (Download, Sparkles)
- Gradient "Back Us" button
- Smooth mobile menu animation
- Visual divider between nav and CTAs

### Improved Footer
- 4-column grid layout (Brand, Product, Company, Legal)
- PXI brand section with tagline
- Better organized navigation links
- Contact email with icon
- Location indicator
- Bottom bar with copyright + CTA
- Responsive design (collapses to 1-2 columns)

### Design Updates
- All pages adjusted for new navbar height (h-20)
- Better spacing and visual hierarchy
- Matches portalys.io aesthetic
- Professional, modern layout

## 🎨 Key Features

- **Real-time Events**: Fetches public albums from Convex
- **Deep Linking**: Redirects to mobile app with invite codes
- **QR Codes**: Easy event joining
- **SEO Optimized**: Meta tags, OG images, Twitter cards
- **Fully Responsive**: Mobile-first design
- **Neon Aesthetic**: Custom PXI brand theme

## 📦 Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS 4
- Convex (shared with PXI Studio)
- Lucide React (icons)
- Embla Carousel (with autoplay)
- qrcode.react

## 🔗 Navigation Structure

- `/` - Home (hero, about, features, events)
- `/#features` - Features section anchor
- `/#events` - Events section anchor
- `/#about` - About section anchor
- `/events/[id]` - Event detail page
- `/album/[id]` - Deep link (redirects to app)
- `/help` - Help & support
- `/privacy` - Privacy policy
- `/terms` - Terms & conditions

## 🎯 Next Steps

1. **Configure Convex** (select existing project in terminal)
2. **Add environment variables**
3. **Test the app** (`npm run dev`)
4. **Deploy to Vercel** (or your preferred platform)

## 💡 Pro Tips

- Keep `convex dev` running in background for live type updates
- The navbar shows different styles when scrolling
- Footer is part of page flow (not fixed)
- All deep links use `pxistudio://` URL scheme
- QR codes generated via QuickChart API

---

**Ready to launch!** 🎉

