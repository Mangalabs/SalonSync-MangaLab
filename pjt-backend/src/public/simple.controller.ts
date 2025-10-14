import { Controller, Get } from '@nestjs/common'

@Controller()
export class SimpleController {
  @Get('test')
  test() {
    return { message: 'Funcionando!' }
  }
}