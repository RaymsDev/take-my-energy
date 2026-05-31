import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogRegistryService } from './catalog.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogRegistryService],
  exports: [CatalogRegistryService],
})
export class CatalogModule {}
