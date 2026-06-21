import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogController } from './catalog.controller';
import { CatalogRegistryService } from './catalog.service';
import {
  CatalogServiceModel,
  CatalogServiceSchema,
} from './schemas/catalog-service.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CatalogServiceModel.name, schema: CatalogServiceSchema },
    ]),
  ],
  controllers: [CatalogController],
  providers: [CatalogRegistryService],
  exports: [CatalogRegistryService],
})
export class CatalogModule {}
