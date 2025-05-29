import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class WorkoutsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('timer:start')
  handleTimerStart(@MessageBody() data: { sessionId: number }) {
    return { event: 'timer:started', data: { sessionId: data.sessionId, startTime: new Date() } };
  }

  @SubscribeMessage('timer:stop')
  handleTimerStop(@MessageBody() data: { sessionId: number }) {
    return { event: 'timer:stopped', data: { sessionId: data.sessionId, endTime: new Date() } };
  }
}