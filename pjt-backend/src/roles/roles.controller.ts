import { Controller, Get, Post, Body, Patch, Param, Delete, Request, BadRequestException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto & { branchId?: string }, @Request() req) {
    const branchId = createRoleDto.branchId || req.user.branchId;
    if (!branchId) {
      throw new BadRequestException('branchId é obrigatório');
    }
    return this.rolesService.create(createRoleDto, branchId);
  }

  @Get()
  findAll(@Request() req) {
    if (!req.user.branchId) {
      throw new BadRequestException('branchId é obrigatório');
    }
    return this.rolesService.findAll(req.user.branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    if (!req.user.branchId) {
      throw new BadRequestException('branchId é obrigatório');
    }
    return this.rolesService.findOne(id, req.user.branchId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto, @Request() req) {
    if (!req.user.branchId) {
      throw new BadRequestException('branchId é obrigatório');
    }
    return this.rolesService.update(id, updateRoleDto, req.user.branchId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    if (!req.user.branchId) {
      throw new BadRequestException('branchId é obrigatório');
    }
    return this.rolesService.remove(id, req.user.branchId);
  }
}