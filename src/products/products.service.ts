import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { PaginateModel, isValidObjectId } from 'mongoose';
import slugify from 'slugify';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './schemas/product.shema';
import { SearchAndFilterQueryDto } from './dto/search-and-filter.dto';

export interface StaticPaths {
  params: {
    slug: string;
  };
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject('SEARCH_SERVICE')
    private readonly searchClient: ClientKafka,

    @Inject('BATCH_SERVICE')
    private readonly batchClient: ClientKafka,

    @Inject('RATE_SERVICE')
    private readonly rateClient: ClientKafka,

    @InjectModel(Product.name)
    private productModel: PaginateModel<Product>,

    @Inject('ORDER_SERVICE')
    private readonly orderClient: ClientKafka,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const createdProduct = await this.productModel
        .create({
          ...createProductDto,
          slug:
            slugify(createProductDto.name, { lower: true }) + '-' + Date.now(),
        })
        .then((doc) => doc.toJSON({ virtuals: true }));

      this.searchClient.emit('search.product.index', createdProduct);
      this.batchClient.emit('batches.orders.created', {
        sync_id: createdProduct._id,
        ...createdProduct,
      });
      this.rateClient.emit('rates.product.created', {
        product_id: createdProduct._id,
        name: createdProduct.name,
        price: createdProduct.price,
        slug: createdProduct.slug,
        image: createdProduct.images[0],
      });
      // send order orders.product.created;
      this.orderClient.emit('orders.product.created', {
        id: createdProduct._id,
        name: createdProduct.name,
        price: createdProduct.price,
        slug: createdProduct.slug,
        image: createdProduct.images[0],
        sale: createdProduct.sale,
      });

      return createdProduct;
    } catch (error) {
      console.error(error);
      throw new RpcException('Failed to create product');
    }
  }

  async findAll(page: number, limit: number) {
    try {
      const options = {
        page: page || 1,
        limit: limit || 10,
        lean: true,
      };
      console.log('options', options);
      return await this.productModel.paginate({}, options);
    } catch (error) {
      throw new RpcException('Cannot find products');
    }
  }

  async searchAndFilter(searchAndFilterQueryDto: SearchAndFilterQueryDto) {
    try {
      const { page, categories, maxPrice, minPrice, orderBy, keyword } =
        searchAndFilterQueryDto;
      console.log(page, categories, maxPrice, minPrice, orderBy, keyword);

      let sortBy;
      let sortDirection = -1;

      switch (orderBy) {
        case 'latest':
          sortBy = 'created_at';
          break;
        case 'sales':
          sortBy = 'sale';
          break;
        case 'asc':
          sortBy = 'price';
          break;
        case 'desc':
          sortDirection = 1;
          sortBy = 'price';
          break;
        default:
          sortBy = 'created_at';
          break;
      }

      const options = {
        page: page || 1,
        limit: 12,
        lean: true,
        sort: {
          [sortBy]: sortDirection,
        },
      };

      const categoryIds = categories?.split(',');

      const query = {
        ...(minPrice && { price: { $gte: minPrice } }),
        ...(maxPrice && { price: { $lte: maxPrice } }),
        ...(maxPrice &&
          minPrice && {
            price: { $gte: minPrice, $lte: maxPrice },
          }),
        ...(keyword && { name: { $regex: keyword, $options: 'i' } }),
        ...(categories && { category: { $in: categoryIds } }),
      };

      console.log('query', query);
      console.log('options', options);

      const products = await this.productModel.paginate(query, options);

      return products;
    } catch (error) {}
  }

  async staticPaths() {
    try {
      const products = await this.productModel
        .find({}, { slug: 1 })
        .lean()
        .exec();

      const staticPaths: StaticPaths[] = products.map((product) => ({
        params: {
          slug: product.slug,
        },
      }));

      return staticPaths;
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

    const product = (await this.productModel.findById(id).exec()).toJSON();
    if (!product) {
      throw new RpcException(`Product with (${id}) not found`);
    }

    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = (await this.productModel.findOne({ slug }).exec()).toJSON();
    if (!product) {
      throw new RpcException(`Product with slug(${slug}) not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    if (!isValidObjectId(id)) {
      throw new RpcException('Invalid ID');
    }

    const product = (
      await this.productModel
        .findByIdAndUpdate(id, updateProductDto, { new: true })
        .exec()
    ).toJSON();

    if (!product) {
      throw new RpcException(`Product with (${id}) not found`);
    }

    return product;
  }

  async delete(id: string): Promise<string> {
    if (!isValidObjectId(id)) {
      throw new RpcException('Invalid ID');
    }

    const product = await this.productModel.findByIdAndDelete(id).lean().exec();
    if (!product) {
      throw new RpcException(`Product with (${id}) not found`);
    }

    return `Product with id(${id}) have been deleted`;
  }
}
