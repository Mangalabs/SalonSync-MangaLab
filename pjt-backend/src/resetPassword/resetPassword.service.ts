import { Injectable } from '@nestjs/common';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SendResetPasswordLinkDto, ResetPasswordLinkDto } from './dto/resetPassword.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ResetPasswordService {

    constructor(
      private prisma: PrismaService,
      private config: ConfigService,
    ) {}

  async generateRequest(data: SendResetPasswordLinkDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const mailerSend = new MailerSend({
      apiKey: process.env.MAIL_SEND_API_KEY || '',
    });

    const sentFrom = new Sender('contato@mangalab.io', 'Mangalab | SalonSync');

    const recipients = [new Recipient(user.email, user.name || "")];

    // const resetURL = `http://localhost:5173/resetpassword?id=${user.id}&token=${this.generateToken(user)}`;
    const resetURL = `https://salondash.mangalab.io/resetpassword?id=${user.id}&token=${this.generateToken(user)}`;

    const personalization = [
      {
        email: user.email,
        data: {
          name: user.name,
          reset_link: resetURL,
        },
      },
    ];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject('This is a Subject')
      .setTemplateId('zr6ke4njw5mgon12')
      .setPersonalization(personalization);

    try {
      await mailerSend.email.send(emailParams);
      return { status: 'ok' };
    } catch (e) {
      console.log(e)
      throw new Error('Não foi possível enviar o email no momento');
    }
  }

  async resetPassword (data: ResetPasswordLinkDto) {
    try {
      const decoded = jwt.verify(data.token, this.config.get<string>('JWT_SECRET') || 'secret') as {email: string, id: string};

      const user = await this.prisma.user.findUnique({
        where: { email: decoded.email },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const encryptedPassword = await bcrypt.hash(data.password, 10);

      const updatedUser = this.prisma.user.update({
        where: { id: decoded.id },
        data: { password: encryptedPassword },
      });

      return updatedUser;
    } catch(e) {
      console.log(e)
      throw new Error('Não foi possível resetar a senha');
    }
  };

  private generateToken(user: any): string {
    const secret = this.config.get<string>('JWT_SECRET') || 'secret';
    return jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '24h' });
  }
}
