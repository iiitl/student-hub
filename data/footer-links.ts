import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from 'react-icons/fa'

const footerLinks = {
  routeLinks: [
    {
      title: 'About',
      links: [
        { name: 'About Us', url: '/about' },
        { name: 'Careers', url: '/careers' },
        { name: 'Contact Us', url: '/contact' },
      ],
    },
    {
      title: 'Support',
      links: [
        { name: 'Help Center', url: '/help' },
        { name: 'Privacy Policy', url: '/privacy' },
        { name: 'Terms of Service', url: '/terms' },
      ],
    },
  ],
  socialLinks: [
    {
      name: 'Facebook',
      url: 'https://www.facebook.com',
      icon: FaFacebook,
    },
    {
      name: 'Twitter',
      url: 'https://www.twitter.com',
      icon: FaTwitter,
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com',
      icon: FaInstagram,
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com',
      icon: FaLinkedinIn,
    },
  ],
}

export { footerLinks }
