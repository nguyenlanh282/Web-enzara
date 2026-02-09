import { Controller, Post, Body } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

class SubscribeDto {
  email: string;
}

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('subscribe')
  async subscribe(@Body() body: SubscribeDto) {
    await this.prisma.setting.upsert({
      where: {
        group_key: { group: 'newsletter', key: body.email },
      },
      update: {
        value: { subscribedAt: Date.now() } as any,
      },
      create: {
        group: 'newsletter',
        key: body.email,
        value: { subscribedAt: Date.now() } as any,
      },
    });

    return { message: 'Dang ky nhan tin thanh cong' };
  }
}
