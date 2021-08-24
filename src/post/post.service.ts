import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscribed } from 'src/subscribed/subscribed.entity';
import { getConnection, Repository } from 'typeorm';
import { GetPostsRequestDto, GetPostsResponseDto } from './dto/getPosts.dto';

@Injectable()
export class PostService {
  async getPosts(params: GetPostsRequestDto): Promise<GetPostsResponseDto> {
    console.log('d', params.loggedUser, params);
    const allSubscribed = await getConnection()
      .getRepository(Subscribed)
      .createQueryBuilder('subscribed')
      .leftJoinAndSelect('subscribed.followers', 'follower')
      .where('follower.id in (:id)', {
        id: params.loggedUser.id,
      })
      .getRawMany();

    console.log(allSubscribed);
    return {
      statusCode: 200,
      message: 'd',
      posts: [],
    };
  }
}
