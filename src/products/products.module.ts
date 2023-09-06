import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from './schemas/product.shema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'SEARCH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'products-search',
              brokers: configService.get('KAFKA_BROKERS').split(','),
            },
            consumer: {
              groupId: 'search-consumer-products',
            },
          },
        }),
      },
      {
        name: 'BATCH_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'batch-products',
              brokers: configService.get('KAFKA_BROKERS').split(','),
            },
            consumer: {
              groupId: 'batch-consumer',
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'RATE_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService) => {
          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'rate-products',
                brokers: configService.get('KAFKA_BROKERS').split(','),
              },
              consumer: {
                groupId: 'rate-consumer',
              },
            },
          };
        },
      },
      {
        name: 'ORDER_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService) => {
          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'order-products',
                brokers: configService.get('KAFKA_BROKERS').split(','),
              },
              consumer: {
                groupId: 'orders-consumer',
              },
            },
          };
        },
      },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
