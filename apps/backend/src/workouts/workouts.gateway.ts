import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  WebSocketServer,
  ConnectedSocket 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'workouts',
})
@UseGuards(WsJwtGuard)
export class WorkoutsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('session:join')
  handleJoinSession(
    @MessageBody() data: { sessionId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user.userId;
    const room = `session-${data.sessionId}`;
    
    client.join(room);
    return { event: 'session:joined', data: { sessionId: data.sessionId } };
  }

  @SubscribeMessage('session:leave')
  handleLeaveSession(
    @MessageBody() data: { sessionId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `session-${data.sessionId}`;
    client.leave(room);
    return { event: 'session:left', data: { sessionId: data.sessionId } };
  }

  @SubscribeMessage('timer:start')
  handleTimerStart(@MessageBody() data: { sessionId: number }) {
    const startTime = new Date();
    this.server.to(`session-${data.sessionId}`).emit('timer:started', {
      sessionId: data.sessionId,
      startTime,
    });
    return { event: 'timer:started', data: { sessionId: data.sessionId, startTime } };
  }

  @SubscribeMessage('timer:pause')
  handleTimerPause(@MessageBody() data: { sessionId: number }) {
    const pauseTime = new Date();
    this.server.to(`session-${data.sessionId}`).emit('timer:paused', {
      sessionId: data.sessionId,
      pauseTime,
    });
    return { event: 'timer:paused', data: { sessionId: data.sessionId, pauseTime } };
  }

  @SubscribeMessage('timer:resume')
  handleTimerResume(@MessageBody() data: { sessionId: number }) {
    const resumeTime = new Date();
    this.server.to(`session-${data.sessionId}`).emit('timer:resumed', {
      sessionId: data.sessionId,
      resumeTime,
    });
    return { event: 'timer:resumed', data: { sessionId: data.sessionId, resumeTime } };
  }

  @SubscribeMessage('timer:sync')
  handleTimerSync(
    @MessageBody() data: { sessionId: number; elapsed: number },
  ) {
    this.server.to(`session-${data.sessionId}`).emit('timer:update', {
      elapsed: data.elapsed,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('set:added')
  handleSetAdded(
    @MessageBody() data: { sessionId: number; set: any },
  ) {
    this.server.to(`session-${data.sessionId}`).emit('set:new', {
      sessionId: data.sessionId,
      set: data.set,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('timer:stop')
  handleTimerStop(@MessageBody() data: { sessionId: number }) {
    const endTime = new Date();
    this.server.to(`session-${data.sessionId}`).emit('timer:stopped', {
      sessionId: data.sessionId,
      endTime,
    });
    return { event: 'timer:stopped', data: { sessionId: data.sessionId, endTime } };
  }
}