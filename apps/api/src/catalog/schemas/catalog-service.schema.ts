import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CatalogServiceDocument = HydratedDocument<CatalogServiceModel>;

@Schema({ timestamps: true })
export class CatalogServiceModel {
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  currency!: string;

  @Prop({
    required: true,
    type: { value: Number, unitText: String },
  })
  duration!: { value: number; unitText: string };
}

export const CatalogServiceSchema =
  SchemaFactory.createForClass(CatalogServiceModel);
