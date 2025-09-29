import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import axios from 'axios';

@Catch()
export class DiscordLoggerFilter implements ExceptionFilter {
  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : (exception as any).message || 'Erro desconhecido';

    const discordMessage = {
      embeds: [
        {
          title: `🚨 Erro na API SalonSync`,
          color: 15158332,
          fields: [
            { name: 'Status', value: status.toString(), inline: true },
            { name: 'Método', value: request.method, inline: true },
            { name: 'Endpoint', value: request.url, inline: true },
            {
              name: 'Mensagem',
              value:
                typeof message === 'string' ? message : JSON.stringify(message),
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      await axios.post(process.env.DISCORD_WEBHOOK_URL!, discordMessage);
    } catch (err) {
      console.error('Falha ao enviar log pro Discord:', err);
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      message,
    });
  }
}
