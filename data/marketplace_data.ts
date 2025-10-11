export type MarketplaceListing = {
  id: number
  name: string
  price: string
  seller: string
  contact: string
  description: string
  location: string
}

export const marketplaceData: { listings: MarketplaceListing[] } = {
  listings: [
    {
      id: 1,
      name: 'Bicycle',
      price: '3000',
      seller: 'Aditya Sharma',
      contact: '9876543210',
      description: 'A well-maintained bicycle for sale.',
      location: 'Saroj New Hostel',
    },
    {
      id: 2,
      name: 'Laptop',
      price: '100000',
      seller: 'Maneesh Shukla ',
      contact: '9876543211',
      description: 'A high-performance laptop for sale.',
      location: 'College Hostel',
    },
    {
      id: 3,
      name: 'Bookshelf',
      price: '1500',
      seller: 'Anirudh Rajora',
      contact: '9876543212',
      description: 'A sturdy bookshelf for sale.',
      location: 'Shanti Niketan Appartment Block B',
    },
    {
      id: 4,
      name: 'Smartphone',
      price: '20000',
      seller: 'Bob Brown',
      contact: '9876543213',
      description: 'A latest model smartphone for sale.',
      location: 'Hostel Block D',
    },
    {
      id: 5,
      name: 'Headphones',
      price: '2500',
      seller: 'Charlie Davis',
      contact: '9876543214',
      description: 'Noise-cancelling headphones for sale.',
      location: 'Hostel Block C',
    },
  ],
}

export default marketplaceData
