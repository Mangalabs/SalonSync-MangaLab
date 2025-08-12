import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Req,
  Query,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { AuthenticatedRequest } from '@/common/middleware/auth.middleware';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os clientes' })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  findAll(
    @Query('branchId') branchId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    // Para admin, usar branchId do query se fornecido, senão usar do contexto
    const targetBranchId = req.user.role === 'ADMIN' && branchId ? branchId : req.user.branchId;
    
    return this.clientsService.findAll({
      id: req.user.id,
      role: req.user.role,
      branchId: targetBranchId,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  create(
    @Body() body: CreateClientDto, 
    @Headers('x-branch-id') branchId: string,
    @Req() req: AuthenticatedRequest
  ) {


    return this.clientsService.create(body, {
      id: req.user.id,
      role: req.user.role,
      branchId: req.user.branchId,
    }, branchId);
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
