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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { AuthenticatedRequest } from '@/common/middleware/auth.middleware';

@ApiTags('professionals')
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly service: ProfessionalsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os profissionais' })
  @ApiResponse({ status: 200, description: 'Lista de profissionais' })
  findAll(
    @Query('branchId') branchId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    // Para admin, usar branchId do query se fornecido, senão usar do contexto
    const targetBranchId =
      req.user.role === 'ADMIN' && branchId ? branchId : req.user.branchId;

    return this.service.findAll({
      id: req.user.id,
      role: req.user.role,
      branchId: targetBranchId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar profissional por ID' })
  @ApiResponse({ status: 200, description: 'Profissional encontrado' })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo profissional' })
  @ApiResponse({ status: 201, description: 'Profissional criado com sucesso' })
  create(
    @Body() body: CreateProfessionalDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.create(
      body,
      {
        id: req.user.id,
        role: req.user.role,
        branchId: req.user.branchId,
      },
      body.branchId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar profissional' })
  @ApiResponse({
    status: 200,
    description: 'Profissional atualizado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  update(@Param('id') id: string, @Body() body: UpdateProfessionalDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover profissional' })
  @ApiResponse({
    status: 200,
    description: 'Profissional removido com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/commission')
  @ApiOperation({ summary: 'Calcular comissão do profissional' })
  @ApiResponse({ status: 200, description: 'Comissão calculada com sucesso' })
  calculateCommission(
    @Param('id') id: string,
    @Query() query: { startDate?: string; endDate?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    // Admin pode ver qualquer comissão, funcionário apenas a própria
    if (req.user.role !== 'ADMIN') {
      // Verificar se o funcionário está tentando ver sua própria comissão
      // Isso será validado no service
    }
    return this.service.calculateCommission(id, query, {
      id: req.user.id,
      role: req.user.role,
      branchId: req.user.branchId,
    });
  }

  @Get(':id/salary-commission-data')
  @ApiOperation({ summary: 'Buscar dados de salário e comissão para despesas fixas' })
  @ApiResponse({ status: 200, description: 'Dados obtidos com sucesso' })
  getSalaryCommissionData(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getSalaryCommissionData(id, {
      id: req.user.id,
      role: req.user.role,
      branchId: req.user.branchId,
    });
  }
}
