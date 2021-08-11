import { commonResponseDto } from 'src/common/common.dto';
import { User } from '../user.entity';

export class FindUserByIdRequestDto {
  id: number;
}

export class FindUserByIdResponseDto extends commonResponseDto {
  user?: User;
}
