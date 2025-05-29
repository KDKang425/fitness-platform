import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const authToken = client.handshake?.auth?.token;
      
      if (!authToken) {
        throw new WsException('Unauthorized');
      }

      const payload = this.jwtService.verify(authToken);
      client.data.user = { userId: payload.sub, email: payload.email };
      
      return true;
    } catch (error) {
      throw new WsException('Unauthorized');
    }
  }
}