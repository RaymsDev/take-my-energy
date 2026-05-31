import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateGiftCardInput } from '@five-of-heart/shared/dto';
import { CatalogRegistryService } from '../catalog/catalog.service';
import { EmailService } from '../email/email.service';
import { GiftCardDocument, GiftCardModel } from './schemas/gift-card.schema';

@Injectable()
export class GiftCardsService {
  constructor(
    @InjectModel(GiftCardModel.name)
    private readonly giftCardModel: Model<GiftCardDocument>,
    private readonly catalogRegistry: CatalogRegistryService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateGiftCardInput): Promise<GiftCardDocument> {
    const service = this.catalogRegistry.findById(dto.serviceId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const code = crypto.randomUUID();

    const card = await this.giftCardModel.create({
      recipientName: dto.recipientName,
      recipientEmail: dto.recipientEmail,
      senderName: dto.senderName,
      message: dto.message,
      serviceName: service.title,
      servicePrice: service.price,
      code,
    });

    // Best-effort: card is already persisted; email failure returns 500 but card survives
    await this.emailService.sendGiftCard({
      to: dto.recipientEmail,
      recipientName: dto.recipientName,
      senderName: dto.senderName,
      serviceName: service.title,
      price: service.price,
      currency: service.currency,
      code,
      message: dto.message,
    });

    return card;
  }

  findAll(): Promise<GiftCardDocument[]> {
    return this.giftCardModel.find().exec();
  }

  async findOne(id: string): Promise<GiftCardDocument> {
    const card = await this.giftCardModel.findById(id).exec();
    if (!card) {
      throw new NotFoundException('Gift card not found');
    }
    return card;
  }

  async redeem(id: string): Promise<GiftCardDocument> {
    const card = await this.giftCardModel.findById(id).exec();
    if (!card) {
      throw new NotFoundException('Gift card not found');
    }

    if (card.status === 'redeemed') {
      return card;
    }

    const updated = await this.giftCardModel
      .findByIdAndUpdate(
        id,
        { status: 'redeemed', redeemedAt: new Date() },
        { new: true },
      )
      .exec();

    return updated as GiftCardDocument;
  }
}
