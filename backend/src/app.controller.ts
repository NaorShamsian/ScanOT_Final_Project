import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // שורש — נשאיר כמו שהיה אצלך
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // מסלול דיאגנוסטיקה ציבורי לחלוטין (ללא קוקיז/גארדים)
  @Get('__up')
  up() {
    return {
      ok: true,
      ts: new Date().toISOString(),
      msg: 'public ping',
    };
  }

  // /health אצלך עושה בדיקות Redis — נשאיר כמו שהוא
  @Get('health')
  async getHealth() {
    try {
      const redisStatus = await this.appService.checkRedisHealth();
      return {
        status: 'OK',
        redis: redisStatus,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'ERROR',
        redis: 'Connection failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('admin/test')
  getTest(): string {
    return 'Smoke test passed! 🚀';
  }
}
