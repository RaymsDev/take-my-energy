import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();
  });

  describe('healthz', () => {
    it('returns status ok', () => {
      const controller = app.get<AppController>(AppController);
      expect(controller.healthz()).toEqual({ status: 'ok' });
    });
  });
});
