import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { commonResponseDto } from 'src/common/common.dto';
import { LoggedUser } from 'src/user/user.decorator';
import { User } from 'src/user/user.entity';
import { AuthGuard } from 'src/user/user.guard';
import { registerRequestDto } from './dto/register.dto';
import { SubscribedService } from './subscribed.service';

@Controller('subscribed')
export class SubscribedController {
  constructor(private readonly subscribedService: SubscribedService) {}

  @Post('/register')
  @UseGuards(AuthGuard)
  async register(
    @Body() params: registerRequestDto,
    @LoggedUser() loggedUser: User,
  ): Promise<commonResponseDto> {
    return this.subscribedService.register({
      url: params.url,
      loggedUser,
    });
  }
}
