import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Sets app.tenant_id for the transaction so RLS can see it,
   * then runs the callback. Callers still pass tenantId in every where clause.
   */
  withTenant<T>(tenantId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    if (!tenantId) throw new Error('TENANT_ID_REQUIRED');
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      return fn(tx as unknown as PrismaClient);
    });
  }
}
