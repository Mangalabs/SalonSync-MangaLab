import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

@ApiTags('professionals')
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly service: ProfessionalsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os profissionais' })
  @ApiResponse({ status: 200, description: 'Lista de profissionais' })
  findAll() {
    return this.service.findAll();
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
  create(@Body() body: CreateProfessionalDto) {
    return this.service.create(body);
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
}
