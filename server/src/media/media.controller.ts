import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Req } from '@nestjs/common';
import { MediaService } from './media.service';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { CreateMediaDto } from './dto/create-media.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditService } from '../audit/audit.service';

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly media: MediaService, private readonly audit: AuditService) {}

  @Post('presign-upload')
  @Roles('CURATOR', 'ADMIN', 'ROOT')
  async presignUpload(@Body() dto: PresignUploadDto, @Req() req: any) {
    const res = await this.media.presignUpload(dto);
    await this.audit.log({
      actorId: (req.user as any)?.userId,
      entity: `Profile:${dto.profileId}`,
      action: 'PRESIGN_UPLOAD',
      diff: { filename: dto.filename, mimeType: dto.mimeType, size: dto.size, type: dto.type },
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    return res;
  }

  @Post()
  @Roles('CURATOR', 'ADMIN', 'ROOT')
  async create(@Body() dto: CreateMediaDto, @Req() req: any) {
    const created = await this.media.create(dto);
    await this.audit.log({
      actorId: (req.user as any)?.userId,
      entity: `MediaAsset:${created.id}`,
      action: 'CREATE',
      diff: { profileId: dto.profileId, type: dto.type, storageKey: dto.storageKey, url: dto.url },
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    return created;
  }

  @Get()
  async list(
    @Query('profileId') profileId?: string,
    @Query('type') type?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.media.list({
      profileId,
      type,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Delete(':id')
  @Roles('ADMIN', 'ROOT')
  async remove(@Param('id') id: string, @Req() req: any) {
    const removed = await this.media.remove(id, true);
    await this.audit.log({
      actorId: (req.user as any)?.userId,
      entity: `MediaAsset:${id}`,
      action: 'DELETE',
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    return removed;
  }
}
