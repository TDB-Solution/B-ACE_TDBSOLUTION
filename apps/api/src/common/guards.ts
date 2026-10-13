import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC, ROLES_KEY, AuthUser } from './auth';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const header = String(request.headers.authorization || '');
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new UnauthorizedException();

    try {
      const payload = this.jwt.verify<AuthUser>(token);
      if (!payload.tenantId || !payload.sub) throw new UnauthorizedException();
      request.user = payload;
      const roles = this.reflector.getAllAndOverride<AuthUser['role'][]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (roles?.length && !roles.includes(payload.role)) return false;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException();
    }
  }
}

