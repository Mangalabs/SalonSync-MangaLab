import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os serviços' })
  @ApiResponse({ status: 200, description: 'Lista de serviços' })
  findAll(
    @Headers('authorization') auth?: string,
    @Headers('x-branch-id') branchId?: string
  ) {
    const token = auth?.replace('Bearer ', '');
    let userId: string | undefined;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { sub: string };
        userId = decoded.sub;
      } catch (error) {}
    }
    
    return this.service.findAll(userId, branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar serviço por ID' })
  @ApiResponse({ status: 200, description: 'Serviço encontrado' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo serviço' })
  @ApiResponse({ status: 201, description: 'Serviço criado com sucesso' })
  create(
    @Body() body: any,
    @Headers('authorization') auth?: string,
    @Headers('x-branch-id') branchId?: string
  ) {
    console.log('Service create - Received body:', body); // Debug log
    console.log('Service create - Body type:', typeof body); // Debug log
    console.log('Service create - Body keys:', Object.keys(body)); // Debug log
    
    const token = auth?.replace('Bearer ', '');
    let userId: string | undefined;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { sub: string };
        userId = decoded.sub;
        console.log('Service create - User ID decoded:', userId); // Debug log
      } catch (error) {
        console.error('Service create - JWT decode error:', error); // Debug log
      }
    }
    
    return this.service.create(body, userId, branchId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar serviço' })
  @ApiResponse({ status: 200, description: 'Serviço atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  update(@Param('id') id: string, @Body() body: UpdateServiceDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover serviço' })
  @ApiResponse({ status: 200, description: 'Serviço removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
