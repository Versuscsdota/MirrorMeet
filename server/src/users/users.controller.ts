import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { IsEmail, IsOptional, IsString, MinLength, IsIn } from 'class-validator';

class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsIn(['CURATOR', 'INTERVIEWER', 'ADMIN', 'ROOT'])
  role?: 'CURATOR' | 'INTERVIEWER' | 'ADMIN' | 'ROOT';
}

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.users.findById(id);
    // скрываем пароль
    const { password, ...safe } = user as any;
    return safe;
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.users.createUser(dto);
    const { password, ...safe } = user as any;
    return safe;
  }
}
