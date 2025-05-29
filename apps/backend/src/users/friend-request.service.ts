import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { FriendRequest, FriendRequestStatus } from './entities/friend-request.entity';
import { Follow } from './entities/follow.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class FriendRequestService {
  constructor(
    @InjectRepository(FriendRequest)
    private requestRepo: Repository<FriendRequest>,
    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,
    private notificationService: NotificationService,
  ) {}

  async sendFriendRequest(requesterId: number, recipientId: number) {
    if (requesterId === recipientId) {
      throw new BadRequestException('자기 자신에게 친구 요청을 보낼 수 없습니다.');
    }

    const [follow1, follow2] = await Promise.all([
      this.followRepo.findOne({
        where: { follower: { id: requesterId }, following: { id: recipientId } },
      }),
      this.followRepo.findOne({
        where: { follower: { id: recipientId }, following: { id: requesterId } },
      }),
    ]);

    if (follow1 && follow2) {
      throw new ConflictException('이미 친구 관계입니다.');
    }

    const existingRequest = await this.requestRepo.findOne({
      where: [
        { requester: { id: requesterId }, recipient: { id: recipientId } },
        { requester: { id: recipientId }, recipient: { id: requesterId } },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === FriendRequestStatus.PENDING) {
        if (existingRequest.requester.id === recipientId) {
          return this.acceptFriendRequest(recipientId, requesterId);
        } else {
          throw new ConflictException('이미 친구 요청을 보냈습니다.');
        }
      } else if (existingRequest.status === FriendRequestStatus.REJECTED) {
        existingRequest.status = FriendRequestStatus.PENDING;
        existingRequest.createdAt = new Date();
        existingRequest.respondedAt = undefined;
        return this.requestRepo.save(existingRequest);
      }
    }

    const request = this.requestRepo.create({
      requester: { id: requesterId } as any,
      recipient: { id: recipientId } as any,
      status: FriendRequestStatus.PENDING,
    });

    const saved = await this.requestRepo.save(request);

    await this.notificationService.createNotification(
      recipientId,
      NotificationType.SOCIAL,
      '새로운 친구 요청',
      '새로운 친구 요청이 도착했습니다.',
      { requestId: saved.id, requesterId }
    );

    return saved;
  }

  async acceptFriendRequest(recipientId: number, requesterId: number) {
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

    request.status = FriendRequestStatus.ACCEPTED;
    request.respondedAt = new Date();
    await this.requestRepo.save(request);

    await Promise.all([
      this.followRepo.save(
        this.followRepo.create({
          follower: { id: requesterId } as any,
          following: { id: recipientId } as any,
        })
      ).catch(() => {}),
      this.followRepo.save(
        this.followRepo.create({
          follower: { id: recipientId } as any,
          following: { id: requesterId } as any,
        })
      ).catch(() => {}),
    ]);

    await this.notificationService.createNotification(
      requesterId,
      NotificationType.SOCIAL,
      '친구 요청 수락됨',
      '친구 요청이 수락되었습니다.',
      { recipientId }
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