import { Injectable } from '@nestjs/common';
import { Subscribed } from 'src/subscribed/subscribed.entity';
import { getConnection, Repository } from 'typeorm';
import {
  GetPostsRequestDto,
  GetPostsResponseDto,
  GetThumbnailAfterParsingResponseDto,
} from './dto/getPosts.dto';

import * as cheerio from 'cheerio';
import * as request from 'request-promise';
import * as rssReader from 'rss-parser';

import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Post } from './post.entity';
@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Subscribed)
    private readonly subscribeds: Repository<Subscribed>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    private readonly configService: ConfigService,
  ) {}

  async getThumbnailAfterParsing(
    url: string,
  ): Promise<GetThumbnailAfterParsingResponseDto> {
    if (
      url.toLowerCase().includes('m.blog.naver.com') ||
      url.toLowerCase().includes('blog.naver.com') ||
      url.toLowerCase().includes('m.blog.naver.com')
    ) {
      const parseNaverPostURL = url.split('/').reverse();
      const naverSpecificTag = parseNaverPostURL[1];
      const naverPostSpecificNo = parseNaverPostURL[0];

      url = `https://blog.naver.com/PostView.naver?blogId=${naverSpecificTag}&logNo=${naverPostSpecificNo}`;
    }

    try {
      const res = await request({ uri: url, rejectUnauthorized: false }).then(
        async (html) => {
          const $ = await cheerio.load(html);
          const isAbleSubscribe = $("meta[property*='og:image']").length;

          if (isAbleSubscribe > 0) {
            const thumbnail = $("meta[property*='og:image']")[0].attribs
              .content;

            return {
              statusCode: 200,
              message: '썸네일을 성공적으로 추출하였습니다.',
              thumbnail,
            };
          } else {
            return {
              statusCode: 404,
              message: '썸네일을 발견하지 못하였습니다.',
              error: "Couldn't Found Thumbnail on Post",
            };
          }
        },
      );

      return res;
    } catch (error) {
      return {
        statusCode: 500,
        message: '썸네일 파싱 중 에러가 발생하였습니다.',
        error: 'An unexpected error occurred on Parsing Thumbnail',
      };
    }
  }

  async renewalPostsByUserId(id: number) {
    const now = Math.floor(new Date().getTime() / 1000);

    try {
      const allSubscribed = await getConnection()
        .getRepository(Subscribed)
        .createQueryBuilder('subscribed')
        .leftJoinAndSelect('subscribed.followers', 'follower')
        .where(
          'follower.id in (:id) \
            AND ((:now) - subscribed.renewalTime > 60000)',
          {
            id,
            now,
          },
        )
        .getRawMany();

      if (allSubscribed && allSubscribed.length > 0) {
        const parser = new rssReader({
          requestOptions: {
            rejectUnauthorized: false,
          },
        });

        await Promise.all(
          allSubscribed.map(async (subscribe, i) => {
            const parseRSSData = await parser.parseURL(
              subscribe.subscribed_feedUrl.replace('https://', 'http://'),
            );

            allSubscribed[i]['rssData'] = parseRSSData;
          }),
        );

        allSubscribed.map(async (subscribe) => {
          if (subscribe.rssData.items && subscribe.rssData.items.length > 0) {
            await Promise.all(
              subscribe.rssData.items.map(async (post) => {
                // eslint-disable-next-line
                let postFormat = {
                  title: post.title,
                  thumbnail: null,
                  description: null,
                  writtenDate: post.pubDate, // 'Sun, 04 Jul 2021 23:51:44 +0900'
                  postUrl: post.link,
                };

                // 1. remove html tag from origin
                const description = post.contentSnippet.replace(/\n/gi, ' ');

                // 2. trim description (100 byte)
                if (description.length > 100) {
                  postFormat.description = `${description.substring(
                    0,
                    100,
                  )}...`;
                }

                const getThumbnailRes = await this.getThumbnailAfterParsing(
                  post.link,
                );

                if (getThumbnailRes && getThumbnailRes.statusCode === 200) {
                  postFormat.thumbnail = getThumbnailRes.thumbnail;
                }

                const alreadySub = await this.subscribeds.findOne({
                  id: subscribe.subscribed_id,
                });

                const alreadyPosts = await this.posts.findOne({
                  postUrl: post.link,
                });

                if (alreadyPosts) {
                  alreadyPosts.title = postFormat.title;
                  alreadyPosts.thumbnail = postFormat.thumbnail;
                  alreadyPosts.description = postFormat.description;
                  alreadyPosts.writtenDate = postFormat.writtenDate;

                  await this.posts.save(alreadyPosts);
                } else {
                  await this.posts.save({
                    title: postFormat.title,
                    thumbnail: postFormat.thumbnail,
                    description: postFormat.description,
                    postUrl: postFormat.postUrl,
                    writtenDate: postFormat.writtenDate,
                    subscribed: alreadySub,
                  });
                }
              }),
            );
          }
        });
      }

      return {
        statusCode: 200,
        message: '포스트 정보를 갱신하였습니다.',
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: '포스트 정보 갱신에 실패하였습니다.',
        error: 'An unexpected error occurred on Parsing Posts',
      };
    }
  }

  //: Promise<GetPostsResponseDto>
  async getPosts(params: GetPostsRequestDto) {
    // 조건(갱신 주기)에 따른 신규 포스트 저장/업데이트
    await this.renewalPostsByUserId(params.loggedUser.id);

    const allSubscribed = await getConnection()
      .getRepository(Subscribed)
      .createQueryBuilder('subscribed')
      .leftJoin('subscribed.followers', 'follower')
      .leftJoin('subscribed.posts', 'postList')
      .select([
        'subscribed.id AS blogUniqueId',
        'subscribed.title AS blogName',
        'subscribed.siteUrl AS blogUrl',
        'subscribed.profileImageUrl AS blogProfileImage',
        'subscribed.serviceOn AS servingFrom',
        'postList.id AS postUniqueId',
        'postList.title AS title',
        'postList.thumbnail AS thumbnail',
        'postList.description AS description',
        'postList.writtenDate AS writtenDate',
      ])
      .where('follower.id in (:id)', {
        id: params.loggedUser.id,
      })
      .getRawMany();

    return allSubscribed;
  }
}
