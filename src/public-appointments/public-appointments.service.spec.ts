import { Test, TestingModule } from '@nestjs/testing';
import { PublicAppointmentsService } from './public-appointments.service';

describe('PublicAppointmentsService', () => {
  let service: PublicAppointmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PublicAppointmentsService],
    }).compile();

    service = module.get<PublicAppointmentsService>(PublicAppointmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
