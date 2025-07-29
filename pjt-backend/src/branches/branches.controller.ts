import {
  Controller,
  Get,
  Headers,
  Patch,
  Param,
  Body,
  Post,
  Delete,
} from '@nestjs/common';
import { BranchesService } from './branches.service';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    return this.branchesService.findAll(token);
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      address?: string;
      phone?: string;
    },
    @Headers('authorization') auth: string,
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.branchesService.create(body, token);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      address?: string;
      phone?: string;
    },
    @Headers('authorization') auth: string,
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.branchesService.update(id, body, token);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    return this.branchesService.delete(id, token);
  }
}
