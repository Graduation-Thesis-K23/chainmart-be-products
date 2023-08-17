import { Controller, Inject, UseFilters } from '@nestjs/common';
import { ClientKafka, MessagePattern, Payload } from '@nestjs/microservices';

import { ProductsService, StaticPaths } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ExceptionFilter } from 'src/filters/rpc-exception.filter';

interface PaginationOptions {
  page?: number;
  limit?: number;
}

@Controller()
@UseFilters(new ExceptionFilter())
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern('products.create')
  create(@Payload() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @MessagePattern('products.findall')
  findAll(@Payload() payload: PaginationOptions) {
    return this.productsService.findAll(payload.page, payload.limit);
  }

  @MessagePattern('products.get-products-by-main')
  getProductsByMain() {
    return this.productsService.getProductsByMain();
  }

  @MessagePattern('products.staticpaths')
  staticPaths(): Promise<StaticPaths[]> {
    return this.productsService.staticPaths();
  }

  @MessagePattern('products.findbyids')
  findByIds(@Payload() ids: string[]) {
    return this.productsService.findByIds(ids);
  }

  @MessagePattern('products.findbyid')
  findById(@Payload() id: string) {
    return this.productsService.findById(id);
  }

  @MessagePattern('products.findbyslug')
  getBySlug(@Payload() slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @MessagePattern('products.update')
  update(@Payload() updateProductDto: UpdateProductDto) {
    console.log(updateProductDto);
    return this.productsService.update(updateProductDto.id, updateProductDto);
  }

  @MessagePattern('products.search-and-filter')
  searchAndFilter(@Payload() updateProductDto: any) {
    return this.productsService.searchAndFilter(updateProductDto);
  }

  @MessagePattern('products.search')
  search(@Payload() keyword: string) {
    return this.productsService.search(keyword);
  }

  @MessagePattern('products.delete')
  delete(@Payload() id: string) {
    return this.productsService.delete(id);
  }
}
