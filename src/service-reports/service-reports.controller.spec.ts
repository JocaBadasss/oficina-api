import { Test, TestingModule } from '@nestjs/testing';
import { ServiceReportsController } from './service-reports.controller';

describe('ServiceReportsController', () => {
  let controller: ServiceReportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceReportsController],
    }).compile();

    controller = module.get<ServiceReportsController>(ServiceReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
