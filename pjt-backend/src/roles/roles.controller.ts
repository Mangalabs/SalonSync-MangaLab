import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AuthenticatedRequest } from '../common/middleware/auth.middleware';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(
    @Body() createRoleDto: CreateRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rolesService.create(createRoleDto, req.user.branchId!);
  }

  @Get()
  findAll(
    @Query('branchId') branchId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rolesService.findAll(branchId || req.user.branchId!);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.rolesService.findOne(id, req.user.branchId!);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rolesService.update(id, updateRoleDto, req.user.branchId!);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.rolesService.remove(id, req.user.branchId!);
  }
}
