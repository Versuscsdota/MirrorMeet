import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, AuditModule],
  providers: [SchedulesService],
  controllers: [SchedulesController],
})
export class SchedulesModule {}
