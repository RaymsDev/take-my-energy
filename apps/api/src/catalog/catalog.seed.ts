import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogService } from '@five-of-heart/shared/interfaces';
import { AppModule } from '../app/app.module';
import { CatalogServiceModel } from './schemas/catalog-service.schema';

const SERVICES: CatalogService[] = [
  {
    id: '1',
    title: 'Soins énergétiques',
    price: 45,
    currency: 'EUR',
    duration: { value: 45, unitText: 'min' },
  },
  {
    id: '2',
    title: 'Massage Holistique',
    price: 65,
    currency: 'EUR',
    duration: { value: 60, unitText: 'min' },
  },
  {
    id: '3',
    title: 'Massage Prénatal',
    price: 60,
    currency: 'EUR',
    duration: { value: 60, unitText: 'min' },
  },
  {
    id: '4',
    title: 'Barrage des brûlures',
    price: 35,
    currency: 'EUR',
    duration: { value: 30, unitText: 'min' },
  },
  {
    id: '5',
    title: 'Massage Knap',
    price: 45,
    currency: 'EUR',
    duration: { value: 45, unitText: 'min' },
  },
  {
    id: '6',
    title: "Bougies d'oreille Hopi",
    price: 40,
    currency: 'EUR',
    duration: { value: 30, unitText: 'min' },
  },
  {
    id: '7',
    title: 'Micro massage crânien',
    price: 45,
    currency: 'EUR',
    duration: { value: 45, unitText: 'min' },
  },
  {
    id: '8',
    title: 'Pierres chaudes',
    price: 60,
    currency: 'EUR',
    duration: { value: 60, unitText: 'min' },
  },
  {
    id: '9',
    title: 'Massage en duo',
    price: 130,
    currency: 'EUR',
    duration: { value: 60, unitText: 'min' },
  },
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  const model = app.get<Model<CatalogService>>(
    getModelToken(CatalogServiceModel.name),
  );

  for (const service of SERVICES) {
    await model.updateOne(
      { id: service.id },
      { $set: service },
      { upsert: true },
    );
  }

  console.log(`Seeded ${SERVICES.length} catalog services.`);
  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
