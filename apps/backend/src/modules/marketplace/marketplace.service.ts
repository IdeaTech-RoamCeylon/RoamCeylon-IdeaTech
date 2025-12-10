import { Injectable } from '@nestjs/common';

@Injectable()
export class MarketplaceService {
  getCategories() {
    return [
      {
        id: '1',
        name: 'Electronics',
        image: 'https://example.com/electronics.jpg',
      },
      {
        id: '2',
        name: 'Souvenirs',
        image: 'https://example.com/souvenirs.jpg',
      },
      {
        id: '3',
        name: 'Food & Spices',
        image: 'https://example.com/spices.jpg',
      },
      { id: '4', name: 'Clothing', image: 'https://example.com/clothing.jpg' },
    ];
  }

  getProducts(category?: string) {
    const allProducts = [
      {
        id: '101',
        name: 'Hand-carved Wooden Elephant',
        category: 'Souvenirs',
        price: 4500.0,
        description: 'Traditional Sri Lankan wooden elephant carving.',
        image: 'https://example.com/elephant.jpg',
      },
      {
        id: '102',
        name: 'Pure Ceylon Tea (BOPF)',
        category: 'Food & Spices',
        price: 1200.0,
        description: 'Premium Ceylon black tea, 500g pack.',
        image: 'https://example.com/tea.jpg',
      },
      {
        id: '103',
        name: 'Cinnamon Sticks (Alba)',
        category: 'Food & Spices',
        price: 850.0,
        description: 'High-quality Ceylon Cinnamon sticks.',
        image: 'https://example.com/cinnamon.jpg',
      },
      {
        id: '104',
        name: 'Batik Sarong',
        category: 'Clothing',
        price: 2500.0,
        description: 'Traditional handmade Batik sarong.',
        image: 'https://example.com/sarong.jpg',
      },
    ];

    if (category) {
      return allProducts.filter((p) => p.category === category);
    }
    return allProducts;
  }

  getProductById(id: string) {
    const products = this.getProducts();
    return products.find((p) => p.id === id);
  }
}
