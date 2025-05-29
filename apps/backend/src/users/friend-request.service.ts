import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FriendRequest,
  FriendRequestStatus,
} from './entities/friend-request.entity';
import { Follow } from '../users/entities/follow.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class FriendRequestService {
  constructor(
    @InjectRepository(FriendRequest)
    private requestRepo: Repository<FriendRequest>,
    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,
    private readonly noti: NotificationService,
) {}

  async sendFriendRequest(requesterId: number, recipientId: number) {
    if (requesterId === recipientId) {
      throw new BadRequestException('자기 자신에게 친구 요청을 보낼 수 없습니다.');
    }

    const [f1, f2] = await Promise.all([
      this.followRepo.findOne({
        where: { follower: { id: requesterId }, following: { id: recipientId } },
      }),
      this.followRepo.findOne({
        where: { follower: { id: recipientId }, following: { id: requesterId } },
      }),
    ]);
    if (f1 && f2) throw new ConflictException('이미 친구 관계입니다.');

    const dup = await this.requestRepo.findOne({
      where: [
        { requester: { id: requesterId }, recipient: { id: recipientId } },
        { requester: { id: recipientId }, recipient: { id: requesterId } },
      ],
    });
    if (dup && dup.status === FriendRequestStatus.PENDING)
      throw new ConflictException('이미 요청이 존재합니다.');

    const saved = await this.requestRepo.save(
      this.requestRepo.create({
        requester: { id: requesterId } as any,
        recipient: { id: recipientId } as any,
        status: FriendRequestStatus.PENDING,
      }),
    );

    await this.noti.create(
      { id: recipientId } as any,
      NotificationType.FRIEND_REQUEST,
      { requesterId },
    );

    return saved;
  }

  async acceptFriendRequest(recipientId: number, requesterId: number) {
    const req = await this.requestRepo.findOne({
      where: {
        requester: { id: requesterId },
        recipient: { id: recipientId },
        status: FriendRequestStatus.PENDING,
      },
    });
    if (!req) throw new NotFoundException('친구 요청을 찾을 수 없습니다.');

    req.status = FriendRequestStatus.ACCEPTED;
    req.respondedAt = new Date();
    await this.requestRepo.save(req);

    await Promise.all([
      this.followRepo.save(
        this.followRepo.create({
          follower: { id: requesterId } as any,
          following: { id: recipientId } as any,
        }),
      ).catch(() => {}),
      this.followRepo.save(
        this.followRepo.create({
          follower: { id: recipientId } as any,
          following: { id: requesterId } as any,
        }),
      ).catch(() => {}),
    ]);

    await this.noti.create(
      { id: requesterId } as any,
      NotificationType.FRIEND_REQUEST_ACCEPTED,
      { recipientId },
    );

    return { success: true, message: '친구 요청을 수락했습니다.' };
  }

  async rejectFriendRequest(recipientId: number, requesterId: number) {
    const request = await this.requestRepo.findOne({
      where: {
        requester: { id: requesterId },
        recipient: { id: recipientId },
        status: FriendRequestStatus.PENDING,
      },
    });

    if (!request) {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }

    request.status = FriendRequestStatus.REJECTED;
    request.respondedAt = new Date();
    await this.requestRepo.save(request);

    return { success: true, message: '친구 요청을 거절했습니다.' };
  }

  async getPendingRequests(userId: number) {
    const [sent, received] = await Promise.all([
      this.requestRepo.find({
        where: {
          requester: { id: userId },
          status: FriendRequestStatus.PENDING,
        },
        relations: ['recipient'],
        order: { createdAt: 'DESC' },
      }),
      this.requestRepo.find({
        where: {
          recipient: { id: userId },
          status: FriendRequestStatus.PENDING,
        },
        relations: ['requester'],
        order: { createdAt: 'DESC' },
      }),
    ]);

    return {
      sent: sent.map(r => ({
        id: r.id,
        user: {
          id: r.recipient.id,
          nickname: r.recipient.nickname,
          profileImageUrl: r.recipient.profileImageUrl,
        },
        createdAt: r.createdAt,
      })),
      received: received.map(r => ({
        id: r.id,
        user: {
          id: r.requester.id,
          nickname: r.requester.nickname,
          profileImageUrl: r.requester.profileImageUrl,
        },
        createdAt: r.createdAt,
      })),
    };
  }

  async cancelFriendRequest(requesterId: number, recipientId: number) {
    const result = await this.requestRepo.delete({
      requester: { id: requesterId },
      recipient: { id: recipientId },
      status: FriendRequestStatus.PENDING,
    });

    if (result.affected === 0) {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }

    return { success: true, message: '친구 요청을 취소했습니다.' };
  }

  async removeFriend(userId: number, friendId: number) {
    await Promise.all([
      this.followRepo.delete({
        follower: { id: userId },
        following: { id: friendId },
      }),
      this.followRepo.delete({
        follower: { id: friendId },
        following: { id: userId },
      }),
    ]);

    await this.requestRepo.update(
      {
        requester: { id: userId },
        recipient: { id: friendId },
        status: FriendRequestStatus.ACCEPTED,
      },
      { status: FriendRequestStatus.REJECTED }
    );

    return { success: true, message: '친구 관계를 해제했습니다.' };
  }
}