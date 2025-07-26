import { Body, Controller, Delete, Get, Param, Post, Patch, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os clientes' })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  findAll(
    @Headers('authorization') auth?: string,
    @Headers('x-branch-id') branchId?: string
  ) {
    console.log('FindAll controller called'); // Debug log
    const token = auth?.replace('Bearer ', '');
    let userId: string | undefined;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { sub: string };
        userId = decoded.sub;
        console.log('FindAll - User ID decoded:', userId); // Debug log
      } catch (error) {
        console.error('FindAll - JWT decode error:', error); // Debug log
      }
    }
    
    return this.clientsService.findAll(userId, branchId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  create(
    @Body() body: any,
    @Headers('authorization') auth?: string,
    @Headers('x-branch-id') branchId?: string
  ) {
    console.log('Received body in controller:', body); // Debug log
    console.log('Body type:', typeof body); // Debug log
    console.log('Body keys:', Object.keys(body)); // Debug log
    
    const token = auth?.replace('Bearer ', '');
    let userId: string | undefined;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'secret';
        const decoded = jwt.verify(token, secret) as { sub: string };
        userId = decoded.sub;
        console.log('User ID decoded:', userId); // Debug log
      } catch (error) {
        console.error('JWT decode error:', error); // Debug log
      }
    } else {
      console.log('No token provided'); // Debug log
    }
    
    return this.clientsService.create(body, userId, branchId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  update(@Param('id') id: string, @Body() body: Partial<CreateClientDto>) {
    return this.clientsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  delete(@Param('id') id: string) {
    return this.clientsService.delete(id);
  }
}
