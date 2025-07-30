import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto, branchId: string) {
    return this.prisma.role.create({
      data: {
        ...createRoleDto,
        branchId,
      },
    });
  }

  async findAll(branchId: string) {
    return this.prisma.role.findMany({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, branchId: string) {
    return this.prisma.role.findFirst({
      where: { id, branchId },
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, branchId: string) {
    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  async remove(id: string, branchId: string) {
    return this.prisma.role.delete({
      where: { id },
    });
  }
}