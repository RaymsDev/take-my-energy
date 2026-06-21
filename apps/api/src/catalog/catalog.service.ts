import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogService } from '@five-of-heart/shared/interfaces';
import {
  CatalogServiceDocument,
  CatalogServiceModel,
} from './schemas/catalog-service.schema';

@Injectable()
export class CatalogRegistryService {
  constructor(
    @InjectModel(CatalogServiceModel.name)
    private readonly model: Model<CatalogServiceDocument>,
  ) {}

  findAll(): Promise<CatalogService[]> {
    return this.model.find().lean<CatalogService[]>().exec();
  }

  findById(id: string): Promise<CatalogServiceDocument | null> {
    return this.model.findOne({ id }).exec();
  }
}
