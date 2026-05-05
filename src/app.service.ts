import { Injectable } from '@nestjs/common';

type HealthStatus = {
  ok: boolean;
  service: string;
};

@Injectable()
export class AppService {
  getHealth(): HealthStatus {
    return { ok: true, service: 'api' };
  }
}
