import { Controller, Post, Get, Body, Request } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { CreateWhatsAppConfigDto } from './dto/whatsapp-config.dto';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  @Post('config')
  async saveConfig(@Request() req: any, @Body() dto: CreateWhatsAppConfigDto) {
    console.log('WhatsApp saveConfig - User:', req.user);
    console.log('WhatsApp saveConfig - BranchId:', req.user.branchId);

    if (!req.user.branchId) {
      throw new Error('BranchId não encontrado para o usuário');
    }

    const result = await this.whatsappService.saveConfig(
      req.user.branchId,
      dto,
    );
    return {
      success: true,
      message: 'Configuração salva com sucesso',
      data: {
        id: result.id,
        accountSid: result.accountSid,
        whatsappNumber: result.whatsappNumber,
        createdAt: result.createdAt,
      },
    };
  }

  @Get('config')
  async getConfig(@Request() req: any) {
    console.log('WhatsApp getConfig - User:', req.user);
    console.log('WhatsApp getConfig - BranchId:', req.user.branchId);

    const targetBranchId = req.headers['x-branch-id'] as string;

    if (!req.user.branchId) {
      throw new Error('BranchId não encontrado para o usuário');
    }

    return await this.whatsappService.getConfig(req.user.branchId || targetBranchId);
  }

  @Post('test')
  async testMessage(@Request() req: any, @Body() body?: { to?: string }) {
    try {
      console.log('WhatsApp test - User:', req.user);
      console.log('WhatsApp test - BranchId:', req.user.branchId);

      if (!req.user.branchId) {
        throw new Error('BranchId não encontrado para o usuário');
      }

      const result = await this.whatsappService.sendTestMessage(
        req.user.branchId,
        body?.to,
      );
      return result;
    } catch (error) {
      console.error('WhatsApp test error:', error);
      throw error;
    }
  }

  @Post('webhook')
  async webhook(@Body() body: any) {
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2));

    try {
      await this.whatsappService.handleIncomingMessage(body);
      return { status: 'ok' };
    } catch (error) {
      console.error('WhatsApp webhook error:', error);
      return { status: 'error', message: error.message };
    }
  }

  @Get('messages')
  async getMessages(@Request() req: any) {
    const targetBranchId = req.headers['x-branch-id'] as string;

    if (!req.user.branchId) {
      throw new Error('BranchId não encontrado para o usuário');
    }

    return await this.whatsappService.getMessages(req.user.branchId || targetBranchId);
  }
}
