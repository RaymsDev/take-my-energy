import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
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
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateGiftCardDto) {
    return this.giftCardsService.create(dto as unknown as CreateGiftCardInput);
  }

  @Get()
  findAll(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.giftCardsService.findAll(
      Math.min(Number(limit) || 100, 100),
      Number(page) || 1,
    );
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
