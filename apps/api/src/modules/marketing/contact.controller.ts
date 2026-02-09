import { Controller, Post, Body } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/services/prisma.service';

class CreateContactDto {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

@Controller('contact')
export class ContactController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async submit(@Body() body: CreateContactDto) {
    const contactId = randomUUID();

    await this.prisma.setting.create({
      data: {
        group: 'contact_submission',
        key: contactId,
        value: {
          name: body.name,
          email: body.email,
          phone: body.phone || null,
          message: body.message,
          createdAt: Date.now(),
        } as any,
      },
    });

    return { message: 'Gui lien he thanh cong' };
  }
}
