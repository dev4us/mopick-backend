import { Body, Controller, Get, UseGuards } from '@nestjs/common';
import { LoggedUser } from 'src/user/user.decorator';
import { User } from 'src/user/user.entity';
import { AuthGuard } from 'src/user/user.guard';
import { UserService } from 'src/user/user.service';
import { GetPostsResponseDto } from './dto/getPosts.dto';
import { PostService } from './post.service';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('/getPosts')
  @UseGuards(AuthGuard)
  // : Promise<GetPostsResponseDto>
  async login(@LoggedUser() loggedUser: User) {
    return this.postService.getPosts({ loggedUser });
  }
}
