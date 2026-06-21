import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';
import { EmailModule } from '../email/email.module';
import { PdfModule } from '../pdf/pdf.module';
import { GiftCardsController } from './gift-cards.controller';
import { GiftCardsService } from './gift-cards.service';
import { GiftCardModel, GiftCardSchema } from './schemas/gift-card.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GiftCardModel.name, schema: GiftCardSchema },
    ]),
    AuthModule,
    CatalogModule,
    EmailModule,
    PdfModule,
  ],
  controllers: [GiftCardsController],
  providers: [GiftCardsService],
})
export class GiftCardsModule {}
