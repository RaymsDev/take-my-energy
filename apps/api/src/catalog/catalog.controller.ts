import { Controller, Get } from '@nestjs/common';
import { CatalogRegistryService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogRegistry: CatalogRegistryService) {}

  @Get()
  findAll() {
    return this.catalogRegistry.findAll();
  }
}
