import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GiftCardDocument = HydratedDocument<GiftCardModel>;

@Schema({ timestamps: true })
export class GiftCardModel {
  @Prop({ required: true })
  recipientName!: string;

  @Prop({ required: true, index: true })
  recipientEmail!: string;

  @Prop({ required: true })
  senderName!: string;

  @Prop()
  message?: string;

  @Prop({ required: true })
  serviceName!: string;

  @Prop({ required: true })
  servicePrice!: number;

  @Prop({ required: true, unique: true })
  code!: string;

  @Prop({
    required: true,
    enum: ['active', 'redeemed'],
    default: 'active',
    index: true,
  })
  status!: 'active' | 'redeemed';

  @Prop()
  redeemedAt?: Date;

  @Prop()
  paymentReference?: string;
}

export const GiftCardSchema = SchemaFactory.createForClass(GiftCardModel);
