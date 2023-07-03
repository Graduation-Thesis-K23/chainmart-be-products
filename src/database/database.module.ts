import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import * as mongooseDelete from 'mongoose-delete';
import * as mongoosePaginate from 'mongoose-paginate-v2';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        mongoose.plugin(mongooseDelete, { deletedAt: true });
        mongoose.plugin(mongoosePaginate);

        return {
          uri: configService.get<string>('MONGODB_URI'),
        };
      },
    }),
  ],
})
export class DatabaseModule {}
