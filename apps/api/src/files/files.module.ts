import { randomUUID } from 'crypto';
import { createReadStream, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, owned, scope } from '../common/auth';
import { CurrentUser } from '../common/current-user.decorator';
import { logActivity } from '../common/activity';

const UPLOADS = resolve(process.cwd(), 'uploads');

type Upload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

function displayName(name: string) {
  const text = Buffer.from(name, 'latin1').toString('utf8').replace(/[\\/]/g, '').trim();
  return text || 'tep-dinh-kem';
}

@ApiTags('files')
@ApiBearerAuth()
@Controller('opportunities/:opportunityId/files')
export class FilesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('opportunityId') opportunityId: string) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      await tx.opportunity.findFirstOrThrow({ where: owned(user, { id: opportunityId }) });
      const rows = await tx.projectFile.findMany({
        where: scope(user.tenantId, { opportunityId }),
        orderBy: { createdAt: 'desc' },
      });
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        mimeType: row.mimeType,
        size: row.size,
        createdAt: row.createdAt.toISOString(),
      }));
    });
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  upload(
    @CurrentUser() user: AuthUser,
    @Param('opportunityId') opportunityId: string,
    @UploadedFile() file?: Upload,
  ) {
    if (!file?.buffer?.length) throw new BadRequestException('Chọn một tệp để tải lên');
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const opportunity = await tx.opportunity.findFirstOrThrow({ where: owned(user, { id: opportunityId }) });
      const storedName = `${randomUUID()}`;
      mkdirSync(UPLOADS, { recursive: true });
      writeFileSync(resolve(UPLOADS, storedName), file.buffer);
      const created = await tx.projectFile.create({
        data: {
          tenantId: user.tenantId,
          opportunityId: opportunity.id,
          name: displayName(file.originalname).slice(0, 180),
          mimeType: file.mimetype || 'application/octet-stream',
          size: file.size,
          storedName,
          createdBy: user.sub,
        },
      });
      await logActivity(tx, user, {
        type: 'note',
        subject: 'Tải tệp lên dự án',
        content: created.name,
        relatedType: 'opportunity',
        relatedId: opportunity.id,
      });
      return {
        id: created.id,
        name: created.name,
        mimeType: created.mimeType,
        size: created.size,
        createdAt: created.createdAt.toISOString(),
      };
    });
  }

  @Get(':fileId')
  async open(
    @CurrentUser() user: AuthUser,
    @Param('opportunityId') opportunityId: string,
    @Param('fileId') fileId: string,
    @Query('download') download: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const row = await this.prisma.withTenant(user.tenantId, async (tx) => {
      await tx.opportunity.findFirstOrThrow({ where: owned(user, { id: opportunityId }) });
      return tx.projectFile.findFirstOrThrow({ where: scope(user.tenantId, { id: fileId, opportunityId }) });
    });
    const encoded = encodeURIComponent(row.name);
    res.setHeader('Content-Type', row.mimeType);
    res.setHeader(
      'Content-Disposition',
      `${download === '1' ? 'attachment' : 'inline'}; filename*=UTF-8''${encoded}`,
    );
    return new StreamableFile(createReadStream(resolve(UPLOADS, row.storedName)));
  }

  @Delete(':fileId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('opportunityId') opportunityId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      await tx.opportunity.findFirstOrThrow({ where: owned(user, { id: opportunityId }) });
      const row = await tx.projectFile.findFirstOrThrow({ where: scope(user.tenantId, { id: fileId, opportunityId }) });
      await tx.projectFile.delete({ where: { id: row.id } });
      try {
        unlinkSync(resolve(UPLOADS, row.storedName));
      } catch {
        // The database row is the source of truth if the disk file is already gone.
      }
      return { ok: true };
    });
  }
}

@Module({ controllers: [FilesController] })
export class FilesModule {}
