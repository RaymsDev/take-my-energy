import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { CatalogRegistryService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogRegistry: CatalogRegistryService) {}

  @Get()
  findAll() {
    return this.catalogRegistry.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const service = await this.catalogRegistry.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }
}
