import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import type { AppRole } from './roles.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(user: any) {
    const payload = { sub: user.id, role: user.role, email: user.email };
    const access_token = await this.jwt.signAsync(payload);
    const { password, ...safe } = user as any;
    return { access_token, user: safe };
  }

  async register(params: { email: string; password: string; firstName?: string; lastName?: string; role?: AppRole }) {
    const exists = await this.users.findByEmail(params.email);
    if (exists) throw new UnauthorizedException('Email already in use');
    const created = await this.users.createUser(params);
    return this.login(created);
  }
}
