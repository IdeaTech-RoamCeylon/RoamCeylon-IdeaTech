import {
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { GetProductsDto } from './dto/get-products.dto';

@Controller('marketplace')
export class MarketplaceController {
  private readonly logger = new Logger(MarketplaceController.name);

  constructor(private readonly marketplaceService: MarketplaceService) { }

  @Get('categories')
  getCategories() {
    this.logger.log('Fetching marketplace categories');
    return this.marketplaceService.getCategories();
  }

  @Get('products')
  getProducts(@Query() query: GetProductsDto) {
    this.logger.log(
      `Fetching products with category: ${query.category || 'all'}`,
    );
    return this.marketplaceService.getProducts(query.category, query.sortBy);
  }

  @Get('products/:id')
  async getProductById(@Param('id') id: string) {
    this.logger.log(`Fetching product details for id: ${id}`);
    const product = await this.marketplaceService.getProductById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }
}
