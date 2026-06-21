import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreateGiftCardInput } from '@five-of-heart/shared/dto';
import { CatalogRegistryService } from '../catalog/catalog.service';
import { EmailService } from '../email/email.service';
import { PdfService } from '../pdf/pdf.service';
import { GiftCardDocument, GiftCardModel } from './schemas/gift-card.schema';

@Injectable()
export class GiftCardsService {
  private readonly logger = new Logger(GiftCardsService.name);

  constructor(
    @InjectModel(GiftCardModel.name)
    private readonly giftCardModel: Model<GiftCardDocument>,
    private readonly catalogRegistry: CatalogRegistryService,
    private readonly emailService: EmailService,
    private readonly pdfService: PdfService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateGiftCardInput): Promise<GiftCardDocument> {
    const service = await this.catalogRegistry.findById(dto.serviceId);
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

    // Best-effort: card is already persisted; PDF/email failures are logged but not propagated
    try {
      const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? '';
      const qrUrl = `${frontendUrl}/cadeau/service/${service.id}`;
      const pdfBuffer = await this.pdfService.generateGiftCardPdf({
        serviceName: service.title,
        recipientName: dto.recipientName,
        senderName: dto.senderName,
        code,
        qrUrl,
      });

      await this.emailService.sendGiftCard({
        to: dto.recipientEmail,
        recipientName: dto.recipientName,
        senderName: dto.senderName,
        serviceName: service.title,
        code,
        message: dto.message,
        pdfBuffer,
      });
    } catch (err) {
      this.logger.error('Gift card PDF/email delivery failed', {
        code,
        error: err,
      });
    }

    return card;
  }

  findAll(limit = 100, page = 1): Promise<GiftCardDocument[]> {
    const skip = (page - 1) * limit;
    return this.giftCardModel.find().skip(skip).limit(limit).exec();
  }

  async findOne(id: string): Promise<GiftCardDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Gift card not found');
    }
    const card = await this.giftCardModel.findById(id).exec();
    if (!card) {
      throw new NotFoundException('Gift card not found');
    }
    return card;
  }

  async redeem(id: string): Promise<GiftCardDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Gift card not found');
    }

    // Atomic: only transitions active → redeemed; concurrent calls are safe
    const updated = await this.giftCardModel
      .findOneAndUpdate(
        { _id: id, status: 'active' },
        { status: 'redeemed', redeemedAt: new Date() },
        { returnDocument: 'after' },
      )
      .exec();

    if (updated) {
      return updated;
    }

    // Null means either already redeemed or does not exist — distinguish
    const existing = await this.giftCardModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException('Gift card not found');
    }
    return existing; // idempotent — already redeemed
  }
}
