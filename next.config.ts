import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/u/**', // Allows all user avatars
      },
      {
        protocol: 'https',
        hostname: 'ts4.mm.bing.net',
        pathname: '/**', // Allows all Participant avatars
      },
      {
        protocol: 'https',
        hostname: 'th.bing.com',
        pathname: '/**', // Allows all Participant avatars
      },
      {
        protocol: 'https',
        hostname: 'www.svgrepo.com',
        pathname: '/**', // Allows all SVG Icons
      },
    ],
  },
}

export default nextConfig
