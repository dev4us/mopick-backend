import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { loginResponseDto } from './dto/login.dto';
import { User } from './user.entity';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async loginOrSignUp(params): Promise<loginResponseDto> {
    try {
      const user = await this.users.findOne({ uniqueId: params['uniqueId'] });
      let token;

      if (user) {
        token = jwt.sign({ id: user.id }, this.configService.get('SECRET_KEY'));
      } else {
        const existUser = await this.users.findOne({ email: params['email'] });

        if (existUser && params['email'] === existUser['email']) {
          return {
            statusCode: 500,
            message: '이미 가입된 이메일이 존재합니다',
            error: 'Exist Signup User',
          };
        }

        const newUser2 = await this.users.save({ ...params });

        token = jwt.sign(
          { id: newUser2['id'] },
          this.configService.get('SECRET_KEY'),
        );
      }
      return {
        statusCode: 200,
        message: '로그인에 성공하였습니다.',
        token,
      };
    } catch (error) {
      console.log(error);
      return {
        statusCode: 400,
        message: '잘못된 요청입니다.',
        error: 'Wrong Request',
      };
    }
  }
}
