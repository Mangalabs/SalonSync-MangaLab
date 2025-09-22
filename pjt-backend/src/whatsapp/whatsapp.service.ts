import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWhatsAppConfigDto } from './dto/whatsapp-config.dto';
import * as crypto from 'crypto';
import { AppointmentsService } from '../appointments/appointments.service';
import { ClientsService } from '../clients/clients.service';
import { ServicesService } from '../services/services.service';
import { ProfessionalsService } from '../professionals/professionals.service';

@Injectable()
export class WhatsAppService {
  private readonly encryptionKey =
    process.env.ENCRYPTION_KEY || 'default-key-32-chars-long-12345';

  constructor(
    private prisma: PrismaService,
    private appointmentsService: AppointmentsService,
    private clientsService: ClientsService,
    private servicesService: ServicesService,
    private professionalsService: ProfessionalsService,
  ) {}

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
    await this.prisma.whatsAppConfig.updateMany({
      where: { branchId, isActive: true },
      data: { isActive: false },
    });

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
      const config = await this.prisma.whatsAppConfig.findFirst({
        where: { branchId, isActive: true },
      });

      if (!config) {
        throw new Error(
          'Configuração do WhatsApp não encontrada para esta filial.',
        );
      }

      if (!toNumber) {
        throw new Error(
          'O número de telefone de destino é obrigatório para enviar uma mensagem de teste.',
        );
      }

      const fromNumber = config.whatsappNumber;

      if (`whatsapp:${fromNumber}` === `whatsapp:${toNumber}`) {
        throw new Error(
          'Para testar, use um número diferente do sandbox. O número de origem e destino não podem ser iguais.',
        );
      }

      const twilio = require('twilio');
      const authToken = this.decrypt(config.authTokenEncrypted);
      const client = twilio(config.accountSid, authToken);

      const message = await client.messages.create({
        body: '🚀 Teste de integração WhatsApp\n\nSeu sistema está configurado corretamente para enviar mensagens via Twilio!',
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${toNumber}`,
      });

      return {
        success: true,
        messageSid: message.sid,
        status: message.status,
        from: fromNumber,
        to: toNumber,
      };
    } catch (error) {
      console.error('WhatsApp Service - sendTestMessage error:', error);
      throw new Error(`Erro ao enviar mensagem de teste: ${error.message}`);
    }
  }

  async handleIncomingMessage(webhookData: any) {
    const { MessageSid, From, To, Body, MessageStatus, AccountSid } =
      webhookData;

    if (!MessageSid || !From || !To || !AccountSid) {
      console.log('Webhook data incomplete:', webhookData);
      return;
    }

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

    await this.processConversation(config, From, Body || '');
  }

  async processConversation(config: any, phoneNumber: string, message: string) {
    const cleanPhone = phoneNumber.replace('whatsapp:', '');

    let conversation = await this.prisma.whatsAppConversation.findFirst({
      where: { branchId: config.branchId, phoneNumber: cleanPhone },
      include: { branch: true },
    });

    if (!conversation) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: config.branchId },
      });
      if (!branch) {
        console.log(`Branch com id ${config.branchId} não encontrado.`);
        return;
      }
      
      const newConversation = await this.prisma.whatsAppConversation.create({
        data: {
          branchId: config.branchId,
          phoneNumber: cleanPhone,
          currentStep: 'GREETING',
          selectedData: {},
        },
        include: { branch: true },
      });
      conversation = newConversation;
    }

    if (!conversation) {
      console.log('Conversation not found and could not be created');
      return;
    }

    const response = await this.generateResponse(conversation, message);

    if (response) {
      if (response.message) {
        await this.sendMessage(
          config,
          cleanPhone,
          response.message,
          response.buttons,
        );
      }

      const updatedConversation = await this.prisma.whatsAppConversation.update(
        {
          where: { id: conversation.id },
          data: {
            currentStep: response.nextStep,
            selectedData: response.selectedData,
            lastMessageAt: new Date(),
          },
          include: { branch: true },
        },
      );

      if (response.nextStep === 'CREATE_APPOINTMENT') {
        const finalResponse = await this.generateResponse(
          updatedConversation,
          '',
        );

        if (finalResponse && finalResponse.message) {
          await this.sendMessage(
            config,
            cleanPhone,
            finalResponse.message,
            finalResponse.buttons,
          );
        }

        if (finalResponse) {
          await this.prisma.whatsAppConversation.update({
            where: { id: conversation.id },
            data: {
              currentStep: finalResponse.nextStep,
              selectedData: finalResponse.selectedData,
              lastMessageAt: new Date(),
            },
          });
        }
      }
    }
  }

  private parseDate(input: string): string | null {
    const cleanInput = input.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 7);

    if (cleanInput === 'hoje') {
      return today.toISOString().split('T')[0];
    }

    if (cleanInput === 'amanhã') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    const match = cleanInput.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10) || today.getFullYear();

      const date = new Date(year, month, day);
      if (date >= today && date <= maxDate) {
        return date.toISOString().split('T')[0];
      }
    }

    return null;
  }

  async generateResponse(conversation: any, message: string) {
    const step = conversation.currentStep;
    const selectedData = conversation.selectedData || {};

    if (message.trim().toLowerCase() === 'cancelar' && step !== 'GREETING') {
      return {
        message: 'Operação cancelada. Se precisar de algo, é só me chamar!',
        nextStep: 'GREETING',
        selectedData: {},
      };
    }

    switch (step) {
      case 'GREETING': {
        const branchName = conversation.branch?.name || 'nosso salão';
        const welcomeMessage = `👋 Olá! Bem-vindo ao *${branchName}*!\n\n📅 Vamos agendar seu atendimento?`;

        return {
          message: welcomeMessage,
          nextStep: 'MENU_SELECT',
          selectedData,
          buttons: [
            { reply: { id: '1', title: '📅 Agendar Serviço' } },
            { reply: { id: '3', title: '💰 Ver Preços' } },
            { reply: { id: '2', title: '📞 Falar com Atendente' } },
            { reply: { id: '0', title: '❌ Sair' } },
          ],
        };
      }

      case 'MENU_SELECT':
        if (message.trim() === '0') {
          return {
            message:
              '👋 Até logo! Volte sempre que precisar. Estamos aqui para te atender! 😊',
            nextStep: 'GREETING',
            selectedData: {},
          };
        } else if (message.trim() === '1') {
          return {
            message:
              '👤 Para prosseguir com o agendamento, preciso do seu nome completo:\n\n✍️ Digite seu nome completo:',
            nextStep: 'NAME_COLLECT',
            selectedData,
          };
        } else if (message.trim() === '2') {
          return {
            message:
              '👥 Perfeito! Em breve você será atendido por um de nossos colaboradores.\n\n⏰ Aguarde um momento, por favor!',
            nextStep: 'WAITING_HUMAN',
            selectedData,
          };
        } else if (message.trim() === '3') {
          const services = await this.prisma.service.findMany({
            where: {
              OR: [{ branchId: conversation.branchId }, { branchId: null }],
            },
            select: { name: true, price: true },
            orderBy: { name: 'asc' },
          });

          let priceList =
            services.length > 0
              ? services
                  .map((s) => `💅 ${s.name}: R$ ${s.price.toFixed(2)}`)
                  .join('\n')
              : 'Nenhum serviço cadastrado ainda.';

          return {
            message: `💰 *Nossos Preços:*\n\n${priceList}\n\nGostaria de agendar algum serviço?`,
            nextStep: 'MENU_SELECT',
            selectedData,
            buttons: [
              { reply: { id: '1', title: '📅 Sim, quero agendar' } },
              { reply: { id: '0', title: '🔙 Menu principal' } },
            ],
          };
        } else {
          return {
            message:
              '❌ Opção inválida. Por favor, toque em uma das opções abaixo:',
            nextStep: 'MENU_SELECT',
            selectedData,
            buttons: [
              { reply: { id: '1', title: '📅 Agendar Serviço' } },
              { reply: { id: '2', title: '📞 Falar com Atendente' } },
              { reply: { id: '3', title: '💰 Ver Preços' } },
              { reply: { id: '0', title: '❌ Sair' } },
            ],
          };
        }

      case 'NAME_COLLECT': {
        if (message.trim().length < 3) {
          return {
            message: 'Por favor, digite um nome e sobrenome válidos.',
            nextStep: 'NAME_COLLECT',
            selectedData,
          };
        }

        const clientName = message.trim();
        const cleanPhone = conversation.phoneNumber;

        const ownerId = conversation.branch.ownerId;
        if (!ownerId) {
          return {
            message: 'Erro: A filial não tem um dono configurado.',
            nextStep: 'GREETING',
            selectedData: {},
          };
        }
        const botUserContext = {
          id: ownerId,
          role: 'ADMIN' as const,
          branchId: conversation.branchId,
        };

        let client = await this.prisma.client.findFirst({
          where: { phone: cleanPhone, branchId: conversation.branchId },
        });

        if (client) {
          if (client.name !== clientName) {
            await this.clientsService.update(client.id, { name: clientName });
          }
        } else {
          client = await this.clientsService.create(
            { name: clientName, phone: cleanPhone },
            botUserContext,
            conversation.branchId,
          );
        }

        const professionals = await this.prisma.professional.findMany({
          where: { branchId: conversation.branchId, active: true },
          select: { id: true, name: true, role: true },
          orderBy: { name: 'asc' },
        });

        if (professionals.length === 0) {
          return {
            message: 'Desculpe, não há profissionais disponíveis no momento.',
            nextStep: 'GREETING',
            selectedData: {},
          };
        }

        const professionalButtons = professionals.map((prof, index) => ({
          reply: {
            id: String(index + 1),
            title: `${prof.name} • ${prof.role}`,
          },
        }));
        professionalButtons.push({ reply: { id: '0', title: '❌ Cancelar' } });

        return {
          message: `👋 Olá *${clientName}*!\n\n👨💼 Escolha um profissional para seu atendimento:`,
          nextStep: 'PROFESSIONAL_SELECT',
          selectedData: {
            ...selectedData,
            clientId: client.id,
            clientName,
            professionals,
            botUserContext,
          },
          buttons: professionalButtons,
        };
      }

      case 'PROFESSIONAL_SELECT': {
        if (message.trim() === '0')
          return {
            message: '❌ Operação cancelada. Até logo!',
            nextStep: 'GREETING',
            selectedData: {},
          };

        const profIndex = parseInt(message.trim()) - 1;
        const professionals = selectedData.professionals || [];

        if (profIndex >= 0 && profIndex < professionals.length) {
          const selectedProfessional = professionals[profIndex];

          const services = await this.prisma.service.findMany({
            where: {
              OR: [{ branchId: conversation.branchId }, { branchId: null }],
            },
            select: { id: true, name: true, price: true },
            orderBy: { name: 'asc' },
          });

          if (services.length === 0) {
            return {
              message:
                '⚠️ Ops! Não há serviços cadastrados ainda.\n\n📞 Entre em contato conosco para mais informações.',
              nextStep: 'MENU_SELECT',
              selectedData,
              buttons: [
                { reply: { id: '2', title: '📞 Falar com Atendente' } },
                { reply: { id: '0', title: '🔙 Menu principal' } },
              ],
            };
          }

          const serviceButtons = services.map((service, index) => ({
            reply: {
              id: String(index + 1),
              title: `${service.name} - R$ ${service.price.toFixed(2)}`,
            },
          }));
          serviceButtons.push({ reply: { id: '0', title: '❌ Cancelar' } });

          return {
            message: `✅ Profissional: *${selectedProfessional.name}*\n\n💅 Agora, escolha o serviço desejado:`,
            nextStep: 'SERVICE_SELECT',
            selectedData: { ...selectedData, selectedProfessional, services },
            buttons: serviceButtons,
          };
        } else {
          return {
            message:
              '❌ Opção inválida. Por favor, escolha um número da lista de profissionais.',
            nextStep: 'PROFESSIONAL_SELECT',
            selectedData,
          };
        }
      }

      case 'SERVICE_SELECT': {
        if (message.trim() === '0')
          return {
            message: '❌ Operação cancelada. Até logo!',
            nextStep: 'GREETING',
            selectedData: {},
          };

        const serviceIndex = parseInt(message.trim()) - 1;
        const services = selectedData.services || [];

        if (serviceIndex >= 0 && serviceIndex < services.length) {
          const selectedService = services[serviceIndex];

          return {
            message: `📅 Ótimo! Agora, informe a data desejada:\n\n📝 *Opções:*\n• "hoje"\n• "amanhã"\n• DD/MM (ex: 25/12)\n\n⚠️ *Limite:* até 7 dias de antecedência`,
            nextStep: 'DATE_SELECT',
            selectedData: { ...selectedData, selectedService },
          };
        } else {
          return {
            message:
              '❌ Opção inválida. Por favor, escolha um número da lista de serviços.',
            nextStep: 'SERVICE_SELECT',
            selectedData,
          };
        }
      }

      case 'DATE_SELECT': {
        const parsedDate = this.parseDate(message);
        if (!parsedDate) {
          return {
            message:
              '❌ Data inválida ou fora do limite.\n\n📅 Use: "hoje", "amanhã" ou DD/MM\n⚠️ Máximo: 7 dias de antecedência',
            nextStep: 'DATE_SELECT',
            selectedData,
          };
        }

        const availableSlots = await this.appointmentsService.getAvailableSlots(
          selectedData.selectedProfessional.id,
          parsedDate,
        );

        if (availableSlots.length > 0) {
          const slotButtons = availableSlots.map((slot, index) => ({
            reply: { id: String(index + 1), title: slot },
          }));
          slotButtons.push({ reply: { id: '0', title: '❌ Cancelar' } });

          return {
            message: `⏰ Horários disponíveis para *${parsedDate}* com *${selectedData.selectedProfessional.name}*:\n\nEscolha um horário:`,
            nextStep: 'TIME_SLOT_SELECT',
            selectedData: {
              ...selectedData,
              selectedDate: parsedDate,
              availableSlots,
            },
            buttons: slotButtons,
          };
        } else {
          return {
            message: `🙁 Desculpe, não há horários disponíveis para *${selectedData.selectedProfessional.name}* no dia *${parsedDate}*.\n\nPor favor, escolha outra data.`,
            nextStep: 'DATE_SELECT',
            selectedData,
          };
        }
      }

      case 'TIME_SLOT_SELECT': {
        if (message.trim() === '0')
          return {
            message: '❌ Operação cancelada. Até logo!',
            nextStep: 'GREETING',
            selectedData: {},
          };

        const slotIndex = parseInt(message.trim()) - 1;
        const availableSlots = selectedData.availableSlots || [];

        if (slotIndex >= 0 && slotIndex < availableSlots.length) {
          const selectedTime = availableSlots[slotIndex];

          const {
            clientName,
            selectedService,
            selectedProfessional,
            selectedDate,
          } = selectedData;
          const confirmationMessage =
            `📝 *Resumo do Agendamento*\n\n` +
            `Cliente: *${clientName}*\n` +
            `Serviço: *${selectedService.name}*\n` +
            `Profissional: *${selectedProfessional.name}*\n` +
            `Data: *${selectedDate}*\n` +
            `Horário: *${selectedTime}*\n\n` +
            `Você confirma o agendamento?`;

          return {
            message: confirmationMessage,
            nextStep: 'CONFIRMATION',
            selectedData: { ...selectedData, selectedTime },
            buttons: [
              { reply: { id: '1', title: '✅ Sim, confirmar' } },
              { reply: { id: '0', title: '❌ Não, cancelar' } },
            ],
          };
        } else {
          return {
            message:
              '❌ Opção inválida. Por favor, escolha um número da lista de horários.',
            nextStep: 'TIME_SLOT_SELECT',
            selectedData,
          };
        }
      }

      case 'CONFIRMATION': {
        const input = message.trim();
        if (input === '1' || input.toLowerCase() === 'sim') {
          return {
            message: 'Confirmado! 🎉 Processando seu agendamento...',
            nextStep: 'CREATE_APPOINTMENT',
            selectedData,
          };
        } else {
          return {
            message:
              'Agendamento cancelado. Se precisar de algo mais, é só chamar!',
            nextStep: 'GREETING',
            selectedData: {},
          };
        }
      }

      case 'CREATE_APPOINTMENT': {
        try {
          const {
            clientId,
            selectedProfessional,
            selectedService,
            selectedDate,
            selectedTime,
            selectedBranch,
            botUserContext,
          } = selectedData;
          const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`);

          await this.appointmentsService.create(
            {
              professionalId: selectedProfessional.id,
              clientId,
              serviceIds: [selectedService.id],
              scheduledAt,
            },
            botUserContext,
            conversation.branchId,
          );

          const branch = await this.prisma.branch.findUnique({
            where: { id: conversation.branchId },
            select: { name: true, address: true, phone: true },
          });

          const branchInfo = branch
            ? `\n\n📍 *${branch.name}*${branch.address ? `\n📍 ${branch.address}` : ''}${branch.phone ? `\n📞 ${branch.phone}` : ''}`
            : '';

          return {
            message: `✅ *Agendamento Confirmado!*\n\n👤 Cliente: *${selectedData.clientName}*\n💅 Serviço: *${selectedService.name}*\n👨‍💼 Profissional: *${selectedProfessional.name}*\n📅 Data: *${selectedDate}*\n🕐 Horário: *${selectedTime}*${branchInfo}\n\n🎉 Seu agendamento foi realizado com sucesso!\n\n⏰ Chegue 10 minutos antes do horário marcado.`,
            nextStep: 'GREETING',
            selectedData: {},
          };
        } catch (error) {
          console.error('Error creating appointment:', error);
          if (
            error.message.includes('Já existe um agendamento neste horário')
          ) {
            return {
              message: `🙁 Ops! Parece que o horário das *${selectedData.selectedTime}* foi agendado por outra pessoa. Por favor, reinicie o processo e escolha outro horário.`,
              nextStep: 'GREETING',
              selectedData: {},
            };
          }
          return {
            message:
              '🙁 Desculpe, ocorreu um erro ao tentar criar seu agendamento. Por favor, tente novamente mais tarde.',
            nextStep: 'GREETING',
            selectedData: {},
          };
        }
      }

      default:
        if (conversation.currentStep !== 'GREETING') {
          return {
            message:
              '❌ Não entendi. Por favor, escolha uma das opções disponíveis.',
            nextStep: conversation.currentStep,
            selectedData,
          };
        }

        return {
          message:
            '👋 Olá! Bem-vindo ao nosso sistema de agendamentos!\n\nEscolha uma opção:',
          nextStep: 'MENU_SELECT',
          selectedData: {},
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
      const fromNumber = config.whatsappNumber;
      const toNumber = `whatsapp:${phoneNumber}`;

      if (buttons && buttons.length > 0) {
        const buttonList = buttons
          .map((btn) => `${btn.reply.id} - ${btn.reply.title}`)
          .join('\n');

        const fullMessage = `${message}\n\n${buttonList}`;

        await client.messages.create({
          body: fullMessage,
          from: `whatsapp:${fromNumber}`,
          to: toNumber,
        });
      } else {
        await client.messages.create({
          body: message,
          from: `whatsapp:${fromNumber}`,
          to: toNumber,
        });
      }

      console.log('Auto-response sent to:', phoneNumber);
    } catch (error) {
      console.error('Error sending auto-response:', error);

      if (error.code === 63038) {
        console.log('Daily message limit exceeded for Twilio Sandbox');
        return;
      }

      throw error;
    }
  }
}
