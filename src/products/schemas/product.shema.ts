import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ProductDocument = mongoose.HydratedDocument<Product>;

@Schema({
  toJSON: {
    virtuals: true,
  },
  timestamps: true,
})
export class Product {
  @Prop()
  name: string;

  @Prop({
    unique: true,
  })
  product_code: string;

  @Prop()
  price: number;

  @Prop({
    default: 0,
  })
  sale: number;

  @Prop({
    type: [String],
  })
  images: string[];

  @Prop()
  supplier_id: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  specifications: object;

  @Prop()
  description: string;

  @Prop({
    default: 100 * 365, // 100 years
  })
  acceptable_expiry_threshold: number;

  @Prop()
  category: string;

  @Prop({
    unique: true,
  })
  slug: string;

  @Prop({
    default: true,
  })
  show: boolean;

  @Prop({
    default: Date.now,
  })
  created_at: Date;

  @Prop({
    nullable: false,
  })
  category_id: string;
}

const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export { ProductSchema };
