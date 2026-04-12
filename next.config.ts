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
        hostname: 'res.cloudinary.com',
        pathname: '/**', // Allows all Cloudinary product images
      },
    ],
  },
}

export default nextConfig
