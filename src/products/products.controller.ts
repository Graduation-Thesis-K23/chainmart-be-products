import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ExceptionFilter } from 'src/filters/rpc-exception.filter';

@Controller()
@UseFilters(new ExceptionFilter())
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern('products.create')
  create(@Payload() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @MessagePattern('products.findall')
  findAll() {
    return this.productsService.findAll();
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

  @MessagePattern('products.delete')
  delete(@Payload() id: string) {
    return this.productsService.delete(id);
  }
}
