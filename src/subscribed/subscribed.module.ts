import { Module } from '@nestjs/common';
import { SubscribedService } from './subscribed.service';
import { SubscribedController } from './subscribed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscribed } from './subscribed.entity';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subscribed, User]), ConfigService],
  providers: [SubscribedService, UserService],
  controllers: [SubscribedController],
})
export class SubscribedModule {}
