/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Face scanning runs client-side only; always bundle Human's browser ESM
  // build. The package's default "node" entry hard-requires
  // @tensorflow/tfjs-node, and its exports map lacks "./"-prefixed subpaths,
  // so we alias the bare specifier straight to the file.
  turbopack: {
    resolveAlias: {
      '@vladmandic/human': './node_modules/@vladmandic/human/dist/human.esm.js',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@vladmandic/human': './node_modules/@vladmandic/human/dist/human.esm.js',
    };
    return config;
  },


  async redirects() {
    return [
      {
        source: '/login/email',
        destination: '/login',
        permanent: false,
      },
      {
        // /platform is canonical; /organizers is a permanent alias
        source: '/organizers',
        destination: '/platform',
        permanent: true,
      },
      {
        source: '/features/white-label-event-ticketing',
        destination: '/features/branded-event-ticketing',
        permanent: true,
      },
      {
        source: '/story/afrodisiac-boston',
        destination: '/story/sanaa-groove-boston',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
