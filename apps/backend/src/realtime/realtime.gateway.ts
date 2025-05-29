import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { RealtimeService } from './realtime.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'realtime',
})
@UseGuards(WsJwtGuard)
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly realtimeService: RealtimeService) {}

  async handleConnection(client: Socket) {
    const userId = client.data.user?.userId;
    if (userId) {
      await this.realtimeService.handleUserConnect(userId, client.id);
      client.join(`user-${userId}`);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.user?.userId;
    if (userId) {
      await this.realtimeService.handleUserDisconnect(userId);
    }
  }

  @SubscribeMessage('workout:start')
  async handleWorkoutStart(
    @MessageBody() data: { sessionId: number; routineName?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user.userId;
    const friends = await this.realtimeService.getFriendIds(userId);
    
    for (const friendId of friends) {
      this.server.to(`user-${friendId}`).emit('friend:workout:started', {
        userId,
        sessionId: data.sessionId,
        routineName: data.routineName,
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('workout:progress')
  async handleWorkoutProgress(
    @MessageBody() data: { sessionId: number; totalVolume: number; setCount: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user.userId;
    const room = `session-${data.sessionId}`;
    
    this.server.to(room).emit('workout:progress:update', {
      userId,
      totalVolume: data.totalVolume,
      setCount: data.setCount,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('competition:join')
  async handleCompetitionJoin(
    @MessageBody() data: { competitionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`competition-${data.competitionId}`);
    
    const participants = await this.realtimeService.getCompetitionParticipants(
      data.competitionId
    );
    
    this.server.to(`competition-${data.competitionId}`).emit('competition:update', {
      participants,
    });
  }

  @SubscribeMessage('competition:create')
  async handleCompetitionCreate(
    @MessageBody() data: { 
      type: 'volume' | 'sets' | 'time'; 
      targetValue: number;
      participantIds: number[];
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user.userId;
    const competition = await this.realtimeService.createCompetition(
      userId,
      data.type,
      data.targetValue,
      data.participantIds
    );
    
    for (const participantId of data.participantIds) {
      this.server.to(`user-${participantId}`).emit('competition:invite', {
        competitionId: competition.id,
        creatorId: userId,
        type: data.type,
        targetValue: data.targetValue,
      });
    }
    
    return competition;
  }

  @SubscribeMessage('workout:finish')
  async handleWorkoutFinish(
    @MessageBody() data: { sessionId: number; stats: any },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user.userId;
    
    const competitions = await this.realtimeService.updateCompetitions(
      userId,
      data.stats
    );
    
    for (const competition of competitions) {
      this.server.to(`competition-${competition.id}`).emit('competition:update', {
        competitionId: competition.id,
        standings: competition.standings,
        winner: competition.winner,
      });
    }
    
    const friends = await this.realtimeService.getFriendIds(userId);
    for (const friendId of friends) {
      this.server.to(`user-${friendId}`).emit('friend:workout:finished', {
        userId,
        sessionId: data.sessionId,
        stats: data.stats,
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('live:toggle')
  async handleLiveToggle(
    @MessageBody() data: { sessionId: number; isLive: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user.userId;
    
    if (data.isLive) {
      await this.realtimeService.setUserLive(userId, data.sessionId);
      const friends = await this.realtimeService.getFriendIds(userId);
      
      for (const friendId of friends) {
        this.server.to(`user-${friendId}`).emit('friend:live:started', {
          userId,
          sessionId: data.sessionId,
        });
      }
    } else {
      await this.realtimeService.setUserOffline(userId);
      const friends = await this.realtimeService.getFriendIds(userId);
      
      for (const friendId of friends) {
        this.server.to(`user-${friendId}`).emit('friend:live:ended', {
          userId,
        });
      }
    }
  }

  @SubscribeMessage('live:watch')
  async handleLiveWatch(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const viewerId = client.data.user.userId;
    const liveSession = await this.realtimeService.getUserLiveSession(data.userId);
    
    if (liveSession) {
      client.join(`live-${data.userId}`);
      this.server.to(`user-${data.userId}`).emit('live:viewer:joined', {
        viewerId,
      });
      
      return {
        sessionId: liveSession.sessionId,
        startTime: liveSession.startTime,
      };
    }
    
    return { error: '실시간 운동이 없습니다.' };
  }
}