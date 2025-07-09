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
    const token = auth?.replace('Bearer ', '');
    let userId: string | undefined;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { sub: string };
        userId = decoded.sub;
      } catch (error) {}
    }
    
    return this.clientsService.findAll(userId, branchId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  create(
    @Body() body: CreateClientDto,
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
