import { Body, Controller, Get, Post } from '@nestjs/common';
import { loginRequestDto, loginResponseDto } from './dto/login.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/login')
  async login(@Body() params: loginRequestDto): Promise<loginResponseDto> {
    if (!params.uniqueId) {
      return {
        statusCode: 400,
        message: '로그인 시도 중 오류가 발생하였습니다.',
        error: 'Required parameters are insufficient.',
      };
    }

    return this.userService.loginOrSignUp(params);
  }
}
