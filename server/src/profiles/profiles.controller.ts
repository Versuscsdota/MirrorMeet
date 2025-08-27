import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Req } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditService } from '../audit/audit.service';

@Controller('profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService, private readonly audit: AuditService) {}

  @Get()
  async list(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.profiles.list({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      search,
    });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.profiles.get(id);
  }

  @Post()
  @Roles('CURATOR', 'ADMIN', 'ROOT')
  async create(@Body() dto: CreateProfileDto, @Req() req: any) {
    const created = await this.profiles.create(dto);
    await this.audit.log({
      actorId: (req.user as any)?.userId,
      entity: `Profile:${created.id}`,
      action: 'CREATE',
      diff: dto,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    return created;
  }

  @Patch(':id')
  @Roles('CURATOR', 'ADMIN', 'ROOT')
  async update(@Param('id') id: string, @Body() dto: UpdateProfileDto, @Req() req: any) {
    const updated = await this.profiles.update(id, dto);
    await this.audit.log({
      actorId: (req.user as any)?.userId,
      entity: `Profile:${id}`,
      action: 'UPDATE',
      diff: dto,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    return updated;
  }

  @Delete(':id')
  @Roles('ADMIN', 'ROOT')
  async remove(@Param('id') id: string, @Req() req: any) {
    const res = await this.profiles.remove(id);
    await this.audit.log({
      actorId: (req.user as any)?.userId,
      entity: `Profile:${id}`,
      action: 'DELETE',
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    return res;
  }
}
