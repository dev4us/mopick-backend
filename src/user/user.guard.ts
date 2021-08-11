import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserService } from './user.service';
import * as jwt from 'jsonwebtoken';
import { commonResponseDto } from 'src/common/common.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const { headers } = context.switchToHttp().getRequest();

    if (!headers || !headers.hasOwnProperty('id_token')) {
      return false;
    } else {
      const token = headers['id_token'];

      try {
        const decoded = jwt.verify(
          token.toString(),
          this.configService.get('SECRET_KEY'),
        );

        if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
          const findUser = await this.userService.findUserById({
            id: decoded.id,
          });

          if (findUser) {
            //headers.loggedUserId = decoded.id;
            headers.loggedUser = findUser.user;
            return true;
          }
        }

        throw new Error();
      } catch (error) {
        return false;
      }
    }
  }
}
