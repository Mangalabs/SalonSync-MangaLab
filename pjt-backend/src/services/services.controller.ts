import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Req,
  Query,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AuthenticatedRequest } from '@/common/middleware/auth.middleware';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os serviços' })
  @ApiResponse({ status: 200, description: 'Lista de serviços' })
  findAll(
    @Query('branchId') branchId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const targetBranchId =
      req.user.role === 'ADMIN' && branchId ? branchId : req.user.branchId;

    return this.service.findAll({
      id: req.user.id,
      role: req.user.role,
      branchId: targetBranchId,
    });
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
    @Body() body: CreateServiceDto,
    @Headers('x-branch-id') branchId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    console.log(
      '🔧 ServicesController: Creating service with branchId header:',
      branchId,
    );
    return this.service.create(
      body,
      {
        id: req.user.id,
        role: req.user.role,
        branchId: req.user.branchId,
      },
      branchId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar serviço' })
  @ApiResponse({ status: 200, description: 'Serviço atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateServiceDto,
    @Headers('x-branch-id') branchId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    console.log(
      '🔧 ServicesController: Updating service with branchId header:',
      branchId,
    );
    return this.service.update(
      id,
      body,
      {
        id: req.user.id,
        role: req.user.role,
        branchId: req.user.branchId,
      },
      branchId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover serviço' })
  @ApiResponse({ status: 200, description: 'Serviço removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
