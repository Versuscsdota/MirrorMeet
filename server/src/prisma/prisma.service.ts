import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Используем process.on вместо Prisma $on, чтобы избежать проблем с типами
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
