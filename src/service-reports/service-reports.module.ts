import { Module } from '@nestjs/common';
import { ServiceReportsController } from './service-reports.controller';
import { ServiceReportsService } from './service-reports.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceReportsController],
  providers: [ServiceReportsService],
})
export class ServiceReportsModule {}
