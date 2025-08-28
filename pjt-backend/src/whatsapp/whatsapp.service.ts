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

  //TODO: Refactor de repetição de código entre funções
  private encrypt(text: string): string {
    const algorithm = 'aes-256-cbc'; //TODO: Mover para .env
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-cbc'; //TODO: Mover para .env
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
      const config = await this.prisma.whatsAppConfig.findFirst({
        where: { branchId, isActive: true },
      });

      if (!config) {
        throw new Error(
          'Configuração do WhatsApp não encontrada para esta filial.',
        );
      }

      const fromNumber = config.whatsappNumber;
      const destinationNumber = toNumber || fromNumber; // Default to sending to self if no number is provided

      if (`whatsapp:${fromNumber}` === `whatsapp:${destinationNumber}`) {
        throw new Error(
          'O número de origem e destino são os mesmos. Para testar, envie para um número de celular pessoal que tenha autorizado no Sandbox da Twilio.',
        );
      }

      const twilio = require('twilio');
      const authToken = this.decrypt(config.authTokenEncrypted);
      const client = twilio(config.accountSid, authToken);

      const message = await client.messages.create({
        body: '🚀 Teste de integração WhatsApp\n\nSeu sistema está configurado corretamente para enviar mensagens via Twilio!',
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${destinationNumber}`,
      });

      return {
        success: true,
        messageSid: message.sid,
        status: message.status,
        from: fromNumber,
        to: destinationNumber,
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

  private parseDate(input: string): string | null {
    const cleanInput = input.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (cleanInput === 'hoje') {
      return today.toISOString().split('T')[0];
    }

    if (cleanInput === 'amanhã') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    // Tenta DD/MM/YYYY ou DD/MM
    const match = cleanInput.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10) || today.getFullYear();

      const date = new Date(year, month, day);
      if (date >= today) {
        return date.toISOString().split('T')[0];
      }
    }

    return null;
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

      case 'NAME_COLLECT': {
        if (message.trim().length < 2) {
          return {
            message:
              'Por favor, digite um nome válido com pelo menos 2 caracteres:',
            nextStep: 'NAME_COLLECT',
            selectedData,
          };
        }

        const clientName = message.trim();
        const cleanPhone = conversation.phoneNumber;

        // 1. Buscar ou criar cliente
        let client = await this.prisma.client.findFirst({
          where: { phone: cleanPhone, branchId: conversation.branchId },
        });

        let clientId: string;

        // 2. Buscar o dono da configuração atual (para escopo de filiais)
        const currentConfig = await this.prisma.whatsAppConfig.findFirst({
          where: { branchId: conversation.branchId, isActive: true },
          include: { branch: { include: { owner: true } } },
        });

        if (
          !currentConfig ||
          !currentConfig.branch ||
          !currentConfig.branch.ownerId
        ) {
          return {
            message:
              'Erro interno de configuração. Tente novamente mais tarde.',
            nextStep: 'GREETING',
            selectedData: {},
          };
        }
        const ownerId = currentConfig.branch.ownerId;
        const botUserContext = {
          id: ownerId,
          role: 'ADMIN' as const,
          branchId: conversation.branchId,
        };

        if (client) {
          clientId = client.id;
          // Opcional: atualizar o nome se for diferente
          if (client.name !== clientName) {
            await this.clientsService.update(client.id, { name: clientName });
          }
        } else {
          const newClient = await this.clientsService.create(
            { name: clientName, phone: cleanPhone },
            botUserContext,
            conversation.branchId,
          );
          clientId = newClient.id;
        }

        // 3. Buscar apenas filiais do mesmo dono
        const availableBranches = await this.prisma.branch.findMany({
          where: {
            ownerId: ownerId,
            isActive: true,
          },
          select: { id: true, name: true },
        });

        const branchButtons = availableBranches.map((branch, index) => ({
          reply: { id: String(index + 1), title: branch.name },
        }));
        branchButtons.push({ reply: { id: '0', title: '❌ Cancelar' } });

        return {
          message: `👋 Olá *${clientName}*!\n\n🏢 Escolha a filial onde deseja agendar:`,
          nextStep: 'BRANCH_SELECT',
          selectedData: {
            ...selectedData,
            clientName,
            clientId, // Armazenando o ID do cliente
            branches: availableBranches,
            botUserContext,
          },
          buttons: branchButtons,
        };
      }

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

      case 'PROFESSIONAL_SELECT': {
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

          // Buscar serviços da filial
          const services = await this.prisma.service.findMany({
            where: {
              branchId: selectedData.selectedBranch.id,
              // isActive: true, // ERROR: This field does not exist on the model
            },
            select: { id: true, name: true, price: true },
          });

          if (services.length === 0) {
            return {
              message:
                'Desculpe, não há serviços disponíveis para esta filial.',
              nextStep: 'GREETING',
              selectedData: {},
            };
          }

          const serviceButtons = services.map((service, index) => ({
            reply: {
              id: String(index + 1),
              title: `${service.name} (R$ ${service.price.toFixed(2)})`,
            },
          }));
          serviceButtons.push({ reply: { id: '0', title: '❌ Cancelar' } });

          return {
            message: `✅ Profissional: *${selectedProfessional.name}*\n\n💅 Agora, escolha o serviço desejado:`,
            nextStep: 'SERVICE_SELECT',
            selectedData: {
              ...selectedData,
              selectedProfessional,
              services,
            },
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
        if (message.trim() === '0') {
          return {
            message: '❌ Operação cancelada. Até logo!',
            nextStep: 'GREETING',
            selectedData: {},
          };
        }

        const serviceIndex = parseInt(message.trim()) - 1;
        const services = selectedData.services || [];

        if (serviceIndex >= 0 && serviceIndex < services.length) {
          const selectedService = services[serviceIndex];

          return {
            message: `📅 Ótimo! Agora, por favor, informe a data para o agendamento (por exemplo, "hoje", "amanhã" ou "25/12/2024"):`,
            nextStep: 'DATE_SELECT',
            selectedData: {
              ...selectedData,
              selectedService,
            },
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

        if (parsedDate) {
          const professionalId = selectedData.selectedProfessional.id;
          const availableSlots =
            await this.appointmentsService.getAvailableSlots(
              professionalId,
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
        } else {
          return {
            message:
              'Data inválida. Por favor, use o formato "DD/MM/YYYY" ou diga "hoje" ou "amanhã".',
            nextStep: 'DATE_SELECT',
            selectedData,
          };
        }
      }

      case 'TIME_SLOT_SELECT': {
        if (message.trim() === '0') {
          return {
            message: '❌ Operação cancelada. Até logo!',
            nextStep: 'GREETING',
            selectedData: {},
          };
        }

        const slotIndex = parseInt(message.trim()) - 1;
        const availableSlots = selectedData.availableSlots || [];

        if (slotIndex >= 0 && slotIndex < availableSlots.length) {
          const selectedTime = availableSlots[slotIndex];

          // Construir a mensagem de confirmação
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
            selectedData: {
              ...selectedData,
              selectedTime,
            },
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
        } else if (input === '0' || input.toLowerCase() === 'não') {
          return {
            message:
              'Agendamento cancelado. Se precisar de algo mais, é só chamar!',
            nextStep: 'GREETING',
            selectedData: {},
          };
        } else {
          return {
            message:
              'Opção inválida. Por favor, digite "1" para confirmar ou "0" para cancelar.',
            nextStep: 'CONFIRMATION',
            selectedData,
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
              clientId: clientId,
              serviceIds: [selectedService.id],
              scheduledAt: scheduledAt,
            },
            botUserContext,
            selectedBranch.id,
          );

          return {
            message: `✅ Agendamento realizado com sucesso para *${selectedService.name}* com *${selectedProfessional.name}* no dia *${selectedDate}* às *${selectedTime}*.`,
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
        // Reiniciar conversa para qualquer mensagem não reconhecida
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
      if (buttons && buttons.length > 0) {
        const buttonText = buttons
          .map((btn) => `*${btn.reply.id}* - ${btn.reply.title}`)
          .join('\n');
        const fullMessage = `${message}\n\n${buttonText}\n\n👆 Digite o número da opção desejada:`;

        await client.messages.create({
          body: fullMessage,
          from: 'whatsapp:+14155238886', // FORCE Sandbox number to fix config issue
          to: `whatsapp:${phoneNumber}`,
        });
      } else {
        await client.messages.create({
          body: message,
          from: 'whatsapp:+14155238886', // FORCE Sandbox number to fix config issue
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
