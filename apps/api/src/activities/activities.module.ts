import { Body, Controller, Get, Module, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, scope } from '../common/auth';
import { CurrentUser } from '../common/current-user.decorator';

class ActivityDto {
  @IsString()
  type!: string;

  @IsString()
  subject!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  relatedType?: string;

  @IsOptional()
  @IsString()
  relatedId?: string;
}

@ApiTags('activities')
@ApiBearerAuth()
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('relatedType') relatedType?: string,
    @Query('relatedId') relatedId?: string,
  ) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const rows = await tx.activity.findMany({
        where: scope(user.tenantId, {
          ...(relatedType ? { relatedType } : {}),
          ...(relatedId ? { relatedId } : {}),
        }),
        orderBy: { createdAt: 'desc' },
        take: 40,
      });
      const users = await tx.user.findMany({ where: scope(user.tenantId), select: { id: true, name: true } });
      const names = new Map(users.map((item) => [item.id, item.name]));
      return rows.map((row) => ({
        id: row.id,
        type: row.type,
        subject: row.subject,
        content: row.content,
        relatedType: row.relatedType,
        relatedId: row.relatedId,
        owner: row.userId ? names.get(row.userId) ?? '' : '',
        createdAt: row.createdAt,
      }));
    });
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: ActivityDto) {
    return this.prisma.withTenant(user.tenantId, (tx) =>
      tx.activity.create({
        data: {
          tenantId: user.tenantId,
          type: dto.type,
          subject: dto.subject,
          content: dto.content,
          relatedType: dto.relatedType,
          relatedId: dto.relatedId,
          userId: user.sub,
        },
      }),
    );
  }
}

@Module({ controllers: [ActivitiesController] })
export class ActivitiesModule {}
