import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Module,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, Roles, scope } from '../common/auth';
import { CurrentUser } from '../common/current-user.decorator';

class UserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsIn(['admin', 'manager', 'sales'])
  role?: 'admin' | 'manager' | 'sales';

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}

class MeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  status: string;
  createdAt: Date;
}) {
  return user;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.withTenant(user.tenantId, (tx) =>
      tx.user.findMany({
        where: scope(user.tenantId),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      }),
    );
  }

  @Post()
  @Roles('admin')
  create(@CurrentUser() user: AuthUser, @Body() dto: UserDto) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const passwordHash = await bcrypt.hash(dto.password || 'password', 10);
      const created = await tx.user.create({
        data: {
          tenantId: user.tenantId,
          name: dto.name,
          email: dto.email.toLowerCase(),
          passwordHash,
          role: dto.role ?? 'sales',
          phone: dto.phone,
          status: dto.status ?? 'active',
        },
      });
      return publicUser(created);
    });
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: MeDto) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const data: { name?: string; phone?: string; passwordHash?: string } = {};
      if (dto.name) data.name = dto.name;
      if (dto.phone !== undefined) data.phone = dto.phone;
      if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);
      return tx.user.update({
        where: { id: user.sub },
        data,
        select: { id: true, name: true, email: true, role: true, phone: true, status: true },
      });
    });
  }

  @Patch(':id')
  @Roles('admin')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UserDto) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      await tx.user.findFirstOrThrow({ where: scope(user.tenantId, { id }) });
      return tx.user.update({
        where: { id },
        data: {
          name: dto.name,
          email: dto.email?.toLowerCase(),
          role: dto.role,
          phone: dto.phone,
          status: dto.status,
          ...(dto.password ? { passwordHash: await bcrypt.hash(dto.password, 10) } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      });
    });
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    if (id === user.sub) throw new ForbiddenException('Không thể xoá chính mình');
    await this.prisma.withTenant(user.tenantId, async (tx) => {
      await tx.user.findFirstOrThrow({ where: scope(user.tenantId, { id }) });
      await tx.user.delete({ where: { id } });
    });
    return { ok: true };
  }
}

@Module({ controllers: [UsersController] })
export class UsersModule {}
