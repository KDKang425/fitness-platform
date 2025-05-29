import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const authToken = this.extractTokenFromClient(client);
      
      if (!authToken) {
        throw new WsException('인증 토큰이 없습니다.');
      }

      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(authToken, { secret });
      client.data.user = { userId: payload.sub, email: payload.email };
      
      return true;
    } catch (error) {
      throw new WsException('인증에 실패했습니다.');
    }
  }

  private extractTokenFromClient(client: Socket): string | undefined {
    return client.handshake?.auth?.token || 
           client.handshake?.headers?.authorization?.split(' ')[1];
  }
}