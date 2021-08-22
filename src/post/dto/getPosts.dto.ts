import { commonResponseDto } from 'src/common/common.dto';
import { User } from 'src/user/user.entity';
import { Post } from '../post.entity';

export class GetPostsRequestDto {
  loggedUser: User;
}

export class GetPostsResponseDto extends commonResponseDto {
  posts: Post[];
}
