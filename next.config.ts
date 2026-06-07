import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/u/**', // Allows all user avatars
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/in/**', // Allows all organization avatars
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
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**', // Allows Google profile images
      },
    ],
  },
}

export default nextConfig
