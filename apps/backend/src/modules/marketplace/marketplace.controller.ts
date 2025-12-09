import { Controller, Get, Logger, Param, Query } from '@nestjs/common';

@Controller('marketplace')
export class MarketplaceController {
  private readonly logger = new Logger(MarketplaceController.name);

  @Get('categories')
  getCategories() {
    this.logger.log('Fetching marketplace categories');
    return [
      { id: '1', name: 'Electronics' },
      { id: '2', name: 'Souvenirs' },
      { id: '3', name: 'Food' },
    ];
  }

  @Get('products')
  getProducts(@Query('category') category?: string) {
    this.logger.log(`Fetching products with category: ${category || 'all'}`);
    return [
      {
        id: '101',
        name: 'Wooden Elephant',
        category: 'Souvenirs',
        price: 25.0,
      },
      { id: '102', name: 'Ceylon Tea', category: 'Food', price: 10.0 },
    ];
  }

  @Get('products/:id')
  getProductById(@Param('id') id: string) {
    this.logger.log(`Fetching product details for id: ${id}`);
    return { id, name: 'Sample Product', description: 'Mock description' };
  }
}
