import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Follow } from './entities/follow.entity';
import { FriendRequest } from './entities/friend-request.entity';
import { FriendRequestService } from './friend-request.service';
import { FriendRequestController } from './friend-request.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Follow, FriendRequest]),
    NotificationModule,
  ],
  controllers: [UsersController, FriendRequestController],
  providers: [UsersService, FriendRequestService],
  exports: [UsersService, FriendRequestService],
})
export class UsersModule {}