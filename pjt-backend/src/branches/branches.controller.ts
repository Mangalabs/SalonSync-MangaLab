import { Controller, Get, Headers, Patch, Param, Body } from '@nestjs/common';
import { BranchesService } from './branches.service';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    return this.branchesService.findAll(token);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      address?: string;
      phone?: string;
    },
    @Headers('authorization') auth: string
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.branchesService.update(id, body, token);
  }
}