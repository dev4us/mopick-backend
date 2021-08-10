import { commonResponseDto } from 'src/common/common.dto';

export class loginRequestDto {
  uniqueId: string;
  email: string;
  username: string;
  profileImage?: string;
}

export class loginResponseDto extends commonResponseDto {
  token?: string;
}
