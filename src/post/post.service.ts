import { Injectable } from '@nestjs/common';
import { Subscribed } from 'src/subscribed/subscribed.entity';
import { getConnection } from 'typeorm';
import {
  GetPostsRequestDto,
  GetPostsResponseDto,
  GetThumbnailAfterParsingResponseDto,
} from './dto/getPosts.dto';

import * as cheerio from 'cheerio';
import * as request from 'request-promise';
import * as rssReader from 'rss-parser';
@Injectable()
export class PostService {
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

  async getPosts(params: GetPostsRequestDto): Promise<GetPostsResponseDto> {
    const allSubscribed = await getConnection()
      .getRepository(Subscribed)
      .createQueryBuilder('subscribed')
      .leftJoinAndSelect('subscribed.followers', 'follower')
      .where('follower.id in (:id)', {
        id: params.loggedUser.id,
      })
      .getRawMany();

    if (allSubscribed && allSubscribed.length > 0) {
      const parser = new rssReader({
        requestOptions: {
          rejectUnauthorized: false,
        },
      });

      try {
        const getAllPostPromise = allSubscribed.map(
          async (atom) =>
            await parser.parseURL(
              atom.subscribed_feedUrl.replace('https://', 'http://'),
            ),
        );

        const getAllPostResult = await Promise.all(getAllPostPromise);

        const parsingPostsDataOnRSS = getAllPostResult.reduce((acc, curr) => {
          const newDatas = curr.items.map((atom) => {
            // 1. remove html tag from origin
            let description = atom.contentSnippet.replace(/\n/gi, ' ');

            if (description.length > 100) {
              description = `${description.substring(0, 100)}...`;
            }

            return {
              title: atom.title,
              thumbnail: null,
              description,
              writtenDate: atom.pubDate, // 'Sun, 04 Jul 2021 23:51:44 +0900'
              postURL: atom.link,
            };
          });

          return [...acc, ...newDatas];
        }, []);

        const attachThumbnailPostsData = await Promise.all(
          parsingPostsDataOnRSS.map(async (atom) => {
            const getThumbnail = await this.getThumbnailAfterParsing(
              atom.postURL,
            );
            //console.log(getThumbnail);
            if (getThumbnail && getThumbnail.statusCode === 200) {
              //console.log(atom);
              return {
                ...atom,
                thumbnail: getThumbnail.thumbnail,
              };
            } else {
              return {
                ...atom,
              };
            }
          }),
        );

        return {
          statusCode: 200,
          message: '포스트 정보를 갱신하였습니다.',
          posts: attachThumbnailPostsData,
        };
      } catch (error) {
        return {
          statusCode: 500,
          message: '포스트를 불러오는 중 오류가 발생하였습니다',
          error: 'An unexpected error occurred on Parsing Posts',
        };
      }
    }
  }
}
