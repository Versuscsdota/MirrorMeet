import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createUser(params: { email: string; password: string; firstName?: string; lastName?: string; role?: any }) {
    const hash = await bcrypt.hash(params.password, 10);
    return this.prisma.user.create({
      data: {
        email: params.email,
        password: hash,
        firstName: params.firstName,
        lastName: params.lastName,
        role: params.role,
      },
    });
  }
}
