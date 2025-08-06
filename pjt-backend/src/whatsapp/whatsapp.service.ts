import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWhatsAppConfigDto } from './dto/whatsapp-config.dto';
import * as crypto from 'crypto';

@Injectable()
export class WhatsAppService {
  private readonly encryptionKey =
    process.env.ENCRYPTION_KEY || 'default-key-32-chars-long-12345';

  constructor(private prisma: PrismaService) {}

  private encrypt(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async saveConfig(branchId: string, dto: CreateWhatsAppConfigDto) {
    // Desativar configurações antigas
    await this.prisma.whatsAppConfig.updateMany({
      where: { branchId, isActive: true },
      data: { isActive: false },
    });

    // Criar nova configuração
    return await this.prisma.whatsAppConfig.create({
      data: {
        branchId,
        accountSid: dto.accountSid,
        authTokenEncrypted: this.encrypt(dto.authToken),
        whatsappNumber: dto.whatsappNumber,
        isActive: true,
      },
    });
  }

  async getConfig(branchId: string) {
    const config = await this.prisma.whatsAppConfig.findFirst({
      where: { branchId, isActive: true },
    });

    if (!config) {
      return { configured: false };
    }

    return {
      configured: true,
      accountSid: config.accountSid,
      whatsappNumber: config.whatsappNumber,
      createdAt: config.createdAt,
    };
  }

  async getMessages(branchId: string) {
    return await this.prisma.whatsAppMessage.findMany({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async sendTestMessage(branchId: string, toNumber?: string) {
    try {
      console.log('sendTestMessage - branchId:', branchId);

      const config = await this.prisma.whatsAppConfig.findFirst({
        where: { branchId, isActive: true },
      });

      console.log('sendTestMessage - config found:', !!config);

      if (!config) {
        throw new Error('Configuração do WhatsApp não encontrada');
      }

      console.log('sendTestMessage - accountSid:', config.accountSid);
      console.log('sendTestMessage - whatsappNumber:', config.whatsappNumber);

      const twilio = require('twilio');
      const authToken = this.decrypt(config.authTokenEncrypted);
      console.log('sendTestMessage - authToken decrypted:', !!authToken);

      const client = twilio(config.accountSid, authToken);

      // Usar número fornecido ou seu número pessoal configurado no Sandbox
      const destinationNumber = toNumber || '+558581263142';
      console.log('sendTestMessage - destinationNumber:', destinationNumber);

      const message = await client.messages.create({
        body: '🚀 Teste de integração WhatsApp\n\nSistema funcionando corretamente!\n\nEsta é uma mensagem de teste enviada via Twilio.',
        from: 'whatsapp:+14155238886', // Número padrão do Twilio Sandbox
        to: `whatsapp:${destinationNumber}`,
      });

      console.log('sendTestMessage - message sent:', message.sid);

      return {
        success: true,
        messageSid: message.sid,
        status: message.status,
        to: destinationNumber,
      };
    } catch (error) {
      console.error('sendTestMessage error:', error);
      throw new Error(`Erro ao enviar mensagem: ${error.message}`);
    }
  }

  async handleIncomingMessage(webhookData: any) {
    const { MessageSid, From, To, Body, MessageStatus, AccountSid } =
      webhookData;

    if (!MessageSid || !From || !To || !AccountSid) {
      console.log('Webhook data incomplete:', webhookData);
      return;
    }

    // Encontrar a configuração baseada no AccountSid
    const config = await this.prisma.whatsAppConfig.findFirst({
      where: {
        accountSid: AccountSid,
        isActive: true,
      },
    });

    if (!config) {
      console.log('No config found for AccountSid:', AccountSid);
      return;
    }

    console.log('Config found for branch:', config.branchId);

    // Salvar mensagem no banco
    await this.prisma.whatsAppMessage.create({
      data: {
        branchId: config.branchId,
        messageSid: MessageSid,
        from: From,
        to: To,
        body: Body || '',
        status: MessageStatus || 'received',
        direction: 'inbound',
      },
    });

    console.log('Message saved:', MessageSid);

    // Processar conversação automática
    await this.processConversation(config, From, Body || '');
  }

  async processConversation(config: any, phoneNumber: string, message: string) {
    const cleanPhone = phoneNumber.replace('whatsapp:', '');

    // Buscar ou criar conversação
    let conversation = await this.prisma.whatsAppConversation.findUnique({
      where: {
        branchId_phoneNumber: {
          branchId: config.branchId,
          phoneNumber: cleanPhone,
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.whatsAppConversation.create({
        data: {
          branchId: config.branchId,
          phoneNumber: cleanPhone,
          currentStep: 'GREETING',
          selectedData: {},
        },
      });
    }

    // Processar mensagem baseada no estado atual
    const response = await this.generateResponse(conversation, message);

    if (response) {
      await this.sendMessage(
        config,
        cleanPhone,
        response.message,
        response.buttons,
      );

      // Atualizar conversação
      await this.prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          currentStep: response.nextStep,
          selectedData: response.selectedData,
          lastMessageAt: new Date(),
        },
      });
    }
  }

  async generateResponse(conversation: any, message: string) {
    const step = conversation.currentStep;
    const selectedData = conversation.selectedData || {};

    switch (step) {
      case 'GREETING':
        return {
          message:
            '👋 Olá! Bem-vindo ao nosso sistema de agendamentos!\n\nEscolha uma opção:',
          nextStep: 'MENU_SELECT',
          selectedData,
          buttons: [
            { reply: { id: '1', title: '📅 Agendar' } },
            { reply: { id: '2', title: '📞 Atendimento' } },
            { reply: { id: '0', title: '❌ Cancelar' } },
          ],
        };

      case 'MENU_SELECT':
        if (message.trim() === '0') {
          return {
            message: '❌ Operação cancelada. Até logo!',
            nextStep: 'GREETING',
            selectedData: {},
          };
        } else if (message.trim() === '1') {
          return {
            message:
              '👤 Para prosseguir com o agendamento, preciso do seu nome completo:\n\nPor favor, digite seu nome completo:',
            nextStep: 'NAME_COLLECT',
            selectedData,
          };
        } else if (message.trim() === '2') {
          return {
            message:
              'Em breve você será atendido por um de nossos colaboradores. Aguarde!',
            nextStep: 'WAITING_HUMAN',
            selectedData,
          };
        } else {
          return {
            message:
              'Opção inválida. Digite *1* para agendar ou *2* para atendimento.',
            nextStep: 'MENU_SELECT',
            selectedData,
          };
        }

      case 'NAME_COLLECT':
        if (message.trim().length < 2) {
          return {
            message:
              'Por favor, digite um nome válido com pelo menos 2 caracteres:',
            nextStep: 'NAME_COLLECT',
            selectedData,
          };
        }

        const clientName = message.trim();
        // Buscar o dono da configuração atual
        const currentConfig = await this.prisma.whatsAppConfig.findFirst({
          where: { branchId: conversation.branchId, isActive: true },
          include: { branch: { include: { owner: true } } },
        });

        if (!currentConfig) {
          return {
            message: 'Erro interno. Tente novamente mais tarde.',
            nextStep: 'GREETING',
            selectedData: {},
          };
        }

        // Buscar apenas filiais do mesmo dono
        const availableBranches = await this.prisma.branch.findMany({
          where: {
            ownerId: currentConfig.branch.ownerId,
            isActive: true,
          },
          select: { id: true, name: true },
        });

        const branchButtons = availableBranches.map((branch, index) => ({
          reply: { id: (index + 1).toString(), title: branch.name },
        }));
        branchButtons.push({ reply: { id: '0', title: '❌ Cancelar' } });

        return {
          message: `👋 Olá *${clientName}*!\n\n🏢 Escolha a filial onde deseja agendar:`,
          nextStep: 'BRANCH_SELECT',
          selectedData: {
            ...selectedData,
            clientName,
            branches: availableBranches,
          },
          buttons: branchButtons,
        };

      case 'BRANCH_SELECT':
        if (message.trim() === '0') {
          return {
            message: '❌ Operação cancelada. Até logo!',
            nextStep: 'GREETING',
            selectedData: {},
          };
        }

        const branchIndex = parseInt(message.trim()) - 1;
        const branches = selectedData.branches || [];

        if (branchIndex >= 0 && branchIndex < branches.length) {
          const selectedBranch = branches[branchIndex];

          // Buscar profissionais da filial selecionada
          const professionals = await this.prisma.professional.findMany({
            where: {
              branchId: selectedBranch.id,
              active: true,
            },
            select: { id: true, name: true, role: true },
          });

          if (professionals.length === 0) {
            return {
              message:
                'Desculpe, não há profissionais disponíveis nesta filial no momento.',
              nextStep: 'GREETING',
              selectedData: {},
            };
          }

          const professionalButtons = professionals.map((prof, index) => ({
            reply: {
              id: (index + 1).toString(),
              title: `${prof.name} • ${prof.role}`,
            },
          }));
          professionalButtons.push({
            reply: { id: '0', title: '❌ Cancelar' },
          });

          return {
            message: `👨‍💼 Profissionais disponíveis em *${selectedBranch.name}*:\n\nEscolha um profissional:`,
            nextStep: 'PROFESSIONAL_SELECT',
            selectedData: {
              ...selectedData,
              selectedBranch,
              professionals,
            },
            buttons: professionalButtons,
          };
        } else {
          return {
            message:
              '❌ Opção inválida. Por favor, escolha um número da lista de filiais.',
            nextStep: 'BRANCH_SELECT',
            selectedData,
          };
        }

      case 'PROFESSIONAL_SELECT':
        if (message.trim() === '0') {
          return {
            message: '❌ Operação cancelada. Até logo!',
            nextStep: 'GREETING',
            selectedData: {},
          };
        }

        const profIndex = parseInt(message.trim()) - 1;
        const professionals = selectedData.professionals || [];

        if (profIndex >= 0 && profIndex < professionals.length) {
          const selectedProfessional = professionals[profIndex];

          return {
            message: `✅ Profissional selecionado: *${selectedProfessional.name}*\n\n🚧 Próximos passos em desenvolvimento:\n• Seleção de serviços\n• Escolha de horários\n• Confirmação do agendamento`,
            nextStep: 'GREETING',
            selectedData: {},
            buttons: [
              { reply: { id: 'restart', title: '🔄 Novo Agendamento' } },
            ],
          };
        } else {
          return {
            message:
              '❌ Opção inválida. Por favor, escolha um número da lista de profissionais.',
            nextStep: 'PROFESSIONAL_SELECT',
            selectedData,
          };
        }

      default:
        // Reiniciar conversa para qualquer mensagem não reconhecida
        return {
          message:
            '👋 Olá! Bem-vindo ao nosso sistema de agendamentos!\n\nEscolha uma opção:',
          nextStep: 'MENU_SELECT',
          selectedData: {},
          buttons: [
            { reply: { id: '1', title: '📅 Agendar' } },
            { reply: { id: '2', title: '📞 Atendimento' } },
          ],
        };
    }
  }

  async sendMessage(
    config: any,
    phoneNumber: string,
    message: string,
    buttons?: any[],
  ) {
    const twilio = require('twilio');
    const client = twilio(
      config.accountSid,
      this.decrypt(config.authTokenEncrypted),
    );

    try {
      if (buttons && buttons.length > 0) {
        // Usar template com botões
        const buttonText = buttons
          .map((btn, index) => `*${index + 1}* - ${btn.reply.title}`)
          .join('\n');
        const fullMessage = `${message}\n\n${buttonText}\n\n👆 Digite o número da opção desejada:`;

        await client.messages.create({
          body: fullMessage,
          from: 'whatsapp:+14155238886',
          to: `whatsapp:${phoneNumber}`,
        });
      } else {
        await client.messages.create({
          body: message,
          from: 'whatsapp:+14155238886',
          to: `whatsapp:${phoneNumber}`,
        });
      }

      console.log('Auto-response sent to:', phoneNumber);
    } catch (error) {
      console.error('Error sending auto-response:', error);

      // Verificar se é limite de mensagens
      if (error.code === 63038) {
        console.log('Daily message limit exceeded for Twilio Sandbox');
        // Não tentar reenviar, apenas logar
        return;
      }

      // Para outros erros, pode tentar novamente ou logar
      throw error;
    }
  }
}
