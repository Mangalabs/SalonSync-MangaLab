import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  ParseUUIDPipe,
  Headers,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { CommissionQueryDto } from './dto/commission-query.dto';

@ApiTags('professionals')
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly service: ProfessionalsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os profissionais' })
  @ApiResponse({ status: 200, description: 'Lista de profissionais' })
  async findAll(
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
      } catch (error) {
        // Token inválido
      }
    }
    
    return this.service.findAll(userId, branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar profissional por ID' })
  @ApiResponse({ status: 200, description: 'Profissional encontrado' })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo profissional' })
  @ApiResponse({ status: 201, description: 'Profissional criado com sucesso' })
  create(
    @Body() body: CreateProfessionalDto,
    @Headers('authorization') auth?: string,
    @Headers('x-branch-id') branchId?: string
  ) {
    console.log('🔍 Professional Create Request:', {
      body,
      hasAuth: !!auth,
      branchId,
      headers: { auth: auth?.substring(0, 20) + '...', branchId }
    });
    
    const token = auth?.replace('Bearer ', '');
    let userId: string | undefined;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { sub: string };
        userId = decoded.sub;
        console.log('✅ Token decoded, userId:', userId);
      } catch (error) {
        console.log('❌ Token decode error:', error.message);
      }
    }
    
    console.log('🚀 Calling service.create with:', { body, userId, branchId });
    return this.service.create(body, userId, branchId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar profissional' })
  @ApiResponse({ status: 200, description: 'Profissional atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  update(@Param('id') id: string, @Body() body: UpdateProfessionalDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover profissional' })
  @ApiResponse({ status: 200, description: 'Profissional removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/commission')
  @ApiOperation({ summary: 'Calcular comissões do profissional' })
  @ApiResponse({ status: 200, description: 'Comissões calculadas com sucesso' })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  calculateCommission(
    @Param('id') id: string,
    @Query() query: CommissionQueryDto
  ) {
    console.log('Recebendo requisição de comissão:', { id, query });
    return this.service.calculateCommission(id, query);
  }
}
