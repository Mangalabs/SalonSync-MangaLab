import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: 'http://localhost:5173' });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('API de Agendamentos')
    .setDescription('API para gerenciamento de agendamentos, profissionais, clientes e serviços')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
bootstrap();
