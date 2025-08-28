import { Controller, Post, Param, Body } from '@nestjs/common';
import { ResetPasswordService } from './resetPassword.service';
import { ResetPasswordLinkDto, SendResetPasswordLinkDto } from './dto/resetPassword.dto';

@Controller('reset')
export class ResetPasswordController {
  constructor(private resetPasswordService: ResetPasswordService) {}

  @Post('generate')
  async generateRequest(@Body() body: SendResetPasswordLinkDto) {
    return this.resetPasswordService.generateRequest(body);
  }

  @Post('reset')
  async resetPassword(
    @Body() body: ResetPasswordLinkDto
  ) {
    return this.resetPasswordService.resetPassword(body);
  }
}
