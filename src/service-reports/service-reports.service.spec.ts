import { Test, TestingModule } from '@nestjs/testing';
import { ServiceReportsService } from './service-reports.service';

describe('ServiceReportsService', () => {
  let service: ServiceReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceReportsService],
    }).compile();

    service = module.get<ServiceReportsService>(ServiceReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
