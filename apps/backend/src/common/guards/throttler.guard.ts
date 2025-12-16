import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

interface RequestWithIp {
  ip?: string;
  [key: string]: any;
}

@Injectable()
export class ThrottlerGuard implements CanActivate {
  private requestCounts = new Map<string, number[]>();
  private readonly limit = 3;
  private readonly ttl = 60000; // 1 minute

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithIp>();
    // Use IP or a mock ID for simplicity
    const ip = request.ip || 'mock-ip';
    const now = Date.now();

    if (!this.requestCounts.has(ip)) {
      this.requestCounts.set(ip, []);
    }

    const timestamps = this.requestCounts.get(ip) || [];
    const windowStart = now - this.ttl;

    // Filter out old requests
    const recentRequests = timestamps.filter(
      (timestamp) => timestamp > windowStart,
    );

    if (recentRequests.length >= this.limit) {
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recentRequests.push(now);
    this.requestCounts.set(ip, recentRequests);

    return true;
  }
}
