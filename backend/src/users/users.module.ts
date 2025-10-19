import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { IamModule } from '../iam';
import { PrismaModule } from '../prisma';
import { CommonModule } from '../common';

@Module({
  imports: [IamModule, PrismaModule, CommonModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
