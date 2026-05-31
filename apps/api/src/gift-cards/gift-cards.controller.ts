import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateGiftCardDto, CreateGiftCardInput } from '@five-of-heart/shared/dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { GiftCardsService } from './gift-cards.service';

@Controller('gift-cards')
@UseGuards(JwtGuard)
export class GiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @Post()
  create(@Body() dto: CreateGiftCardDto) {
    return this.giftCardsService.create(dto as unknown as CreateGiftCardInput);
  }

  @Get()
  findAll() {
    return this.giftCardsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.giftCardsService.findOne(id);
  }

  @Patch(':id/redeem')
  redeem(@Param('id') id: string) {
    return this.giftCardsService.redeem(id);
  }
}
