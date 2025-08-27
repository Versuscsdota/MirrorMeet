import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards, Req } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto, SetStatusDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditService } from '../audit/audit.service';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService, private readonly audit: AuditService) {}

  @Get()
  async list(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('profileId') profileId?: string,
    @Query('interviewerId') interviewerId?: string,
    @Query('status') status?: string,
  ) {
    return this.schedules.list({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      profileId,
      interviewerId,
      status,
    });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.schedules.get(id);
  }

  @Post()
  @Roles('CURATOR', 'ADMIN', 'ROOT')
  async create(@Body() dto: CreateScheduleDto, @Req() req: any) {
    const created = await this.schedules.create(dto);
    await this.audit.log({
      actorId: (req.user as any)?.userId,
      entity: `ScheduleEvent:${created.id}`,
      action: 'CREATE',
      diff: dto,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    return created;
  }

  @Patch(':id')
  @Roles('CURATOR', 'ADMIN', 'ROOT')
  async update(@Param('id') id: string, @Body() dto: UpdateScheduleDto, @Req() req: any) {
    const updated = await this.schedules.update(id, dto);
    await this.audit.log({
      actorId: (req.user as any)?.userId,
      entity: `ScheduleEvent:${id}`,
      action: 'UPDATE',
      diff: dto,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    return updated;
  }

  @Put(':id/status')
  @Roles('CURATOR', 'ADMIN', 'ROOT')
  async setStatus(@Param('id') id: string, @Body() dto: SetStatusDto, @Req() req: any) {
    const updated = await this.schedules.setStatus(id, dto.status, dto.notes);
    await this.audit.log({
      actorId: (req.user as any)?.userId,
      entity: `ScheduleEvent:${id}`,
      action: 'STATUS_CHANGE',
      diff: { status: dto.status, notes: dto.notes },
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    return updated;
  }

  @Delete(':id')
  @Roles('ADMIN', 'ROOT')
  async remove(@Param('id') id: string, @Req() req: any) {
    const res = await this.schedules.remove(id);
    await this.audit.log({
      actorId: (req.user as any)?.userId,
      entity: `ScheduleEvent:${id}`,
      action: 'DELETE',
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    return res;
  }
}
