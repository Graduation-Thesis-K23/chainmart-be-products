import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { PaginateModel, isValidObjectId } from 'mongoose';
import slugify from 'slugify';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './schemas/product.shema';

@Injectable()
export class ProductsService {
  constructor(
    @Inject('SEARCH_SERVICE')
    private readonly searchClient: ClientKafka,

    @Inject('BATCH_SERVICE')
    private readonly batchClient: ClientKafka,

    @InjectModel(Product.name)
    private productModel: PaginateModel<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const product = await this.productModel
        .create({
          ...createProductDto,
          slug:
            slugify(createProductDto.name, { lower: true }) + '-' + Date.now(),
        })
        .then((doc) => doc.toObject());

      this.searchClient.emit('search.product.index', product);
      this.batchClient.emit('batches.orders.created', {
        sync_id: product._id,
        product_code: product.product_code,
        price: product.price,
        sale: product.sale,
        acceptable_expiry_threshold: product.acceptable_expiry_threshold,
      });

      return product;
    } catch (error) {
      console.error(error);
      throw new RpcException('Failed to create product');
    }
  }

  async findAll() {
    try {
      const options = {
        page: 1,
        limit: 10,
        lean: true,
      };
      return await this.productModel.paginate({}, options);
    } catch (error) {
      throw new RpcException('Cannot find products');
    }
  }

  async findByIds(ids: string[]) {
    try {
      return await this.productModel
        .find({
          _id: {
            $in: ids,
          },
        })
        .lean()
        .exec();
    } catch (error) {
      throw new RpcException('Cannot find products by list of id');
    }
  }

  async findById(id: string): Promise<Product> {
    if (!isValidObjectId(id)) {
      throw new RpcException('Invalid ID');
    }

    const product = await this.productModel.findById(id).lean().exec();
    if (!product) {
      throw new RpcException(`Product with (${id}) not found`);
    }

    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productModel.findOne({ slug }).lean().exec();
    if (!product) {
      throw new RpcException(`Product with slug(${slug}) not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    if (!isValidObjectId(id)) {
      throw new RpcException('Invalid ID');
    }

    const product = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .lean()
      .exec();

    if (!product) {
      throw new RpcException(`Product with (${id}) not found`);
    }

    this.searchClient.emit('search.product.update', product);

    return product;
  }

  async delete(id: string) {
    if (!isValidObjectId(id)) {
      throw new RpcException('Invalid ID');
    }

    const product = await this.productModel.findByIdAndDelete(id).lean().exec();
    if (!product) {
      throw new RpcException(`Product with (${id}) not found`);
    }

    this.searchClient.emit('search.product.delete', id);

    return `Product with id(${id}) have been deleted`;
  }
}
