import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { commonResponseDto } from 'src/common/common.dto';
import { Repository } from 'typeorm';
import {
  getRssAddressResponseDto,
  parsingRSSResponseDto,
  registerRequestDto,
} from './dto/register.dto';
import { Subscribed } from './subscribed.entity';

import * as request from 'request-promise';
import * as cheerio from 'cheerio';
import * as rssReader from 'rss-parser';
import * as queryString from 'query-string';

@Injectable()
export class SubscribedService {
  constructor(
    @InjectRepository(Subscribed)
    private readonly subscribeds: Repository<Subscribed>,
  ) {}

  async getRssAddress(url: string): Promise<getRssAddressResponseDto> {
    const res = await request(url).then(async (html) => {
      const $ = await cheerio.load(html);
      const isAbleSubscribe = $("link[type*='application/rss']").length;

      if (isAbleSubscribe > 0) {
        const feedUrl = $("link[type*='application/rss']")[0].attribs.href;

        return {
          statusCode: 200,
          message: 'RSS 주소를 성공적으로 발견하였습니다.',
          feedUrl,
        };
      } else {
        return {
          statusCode: 500,
          message: 'RSS 주소를 발견하지 못하였습니다.',
          error: "couldn't Found RSS Address",
        };
      }
    });

    return res;
  }

  async parsingRSS(url: string): Promise<parsingRSSResponseDto> {
    try {
      const parser = new rssReader();
      const rssData = await parser.parseURL(url);

      return {
        statusCode: 200,
        message: '성공적으로 등록하였습니다.',
        data: {
          title: rssData.title,
          siteUrl: rssData.link,
          serviceOn: rssData.generator,
          feedUrl: url,
        },
      };
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        // 존재하지 않는 url
        return {
          statusCode: 404,
          message: '존재하지 않는 RSS 또는 블로그 주소입니다.',
        };
      } else {
        // RSS가 아님을 판단, 직접 파싱하는 단계로 돌입
        return {
          statusCode: 400,
          message: 'RSS가 아닌 블로그 주소입니다.',
        };
      }
    }
  }

  async register(params: registerRequestDto): Promise<commonResponseDto> {
    try {
      // S0. RSS 파싱을 우선적으로 시도함.
      const parsingRSS = await this.parsingRSS(params.url);
      let rssData;

      if (parsingRSS && parsingRSS.statusCode == 200) {
        rssData = parsingRSS;
      } else if (parsingRSS && parsingRSS.statusCode == 400) {
        // S1. 브런치
        if (params.url.toLowerCase().includes('brunch.co.kr')) {
          let parsedFeedUrl;

          // S1-1. 최상위 경로로 이동하여야 함.
          const brunchUniqueId = params.url
            .split('brunch.co.kr/')
            .reverse()[0]
            .split('/')[0];

          // S1-2. 최상위 경로로 이동 후 다시 한번 파싱을 시도함
          parsedFeedUrl = await this.getRssAddress(
            `https://brunch.co.kr/${brunchUniqueId}`,
          );

          if (parsedFeedUrl.statusCode === 200) {
            // S1-3. 파싱한 RSS 주소를 통하여 재시도
            return (rssData = await this.register({
              url: parsedFeedUrl.feedUrl,
              loggedUser: params.loggedUser,
            }));
          } else {
            throw new Error();
          }
        } else if (params.url.toLowerCase().includes('tistory.com')) {
          // S2. 티스토리
          // S2-1. 고유 아이디 파싱
          const tistoryUniqueId = params.url
            .split('.tistory.com')[0]
            .split('/')
            .reverse()[0];

          // S2-2. 최상위 경로로 이동 후 다시 한번 파싱을 시도함
          return (rssData = await this.register({
            url: `https://${tistoryUniqueId}.tistory.com/rss`,
            loggedUser: params.loggedUser,
          }));
        } else if (
          params.url.toLowerCase().includes('blog.naver.com') &&
          params.url.toLowerCase().includes('blogid')
        ) {
          // S3. 네이버 블로그 (아이디가 쿼리스트링으로 존재하는 경우)
          // S3-ex. 최신 추천 글, 연관 포스트 등으로 접근한 경우
          let parsedFeedUrl;
          const querys = queryString.parse(params.url);

          if (querys.blogId) {
            parsedFeedUrl = await this.getRssAddress(
              `https://blog.naver.com/${querys.blogId}`,
            );

            if (parsedFeedUrl.statusCode === 200) {
              // S4-2. 파싱한 RSS 주소를 통하여 재시도
              return (rssData = await this.register({
                url: parsedFeedUrl.feedUrl,
                loggedUser: params.loggedUser,
              }));
            } else {
              throw new Error();
            }
          }
        } else if (params.url.toLowerCase().includes('m.blog.naver.com')) {
          // S4. 네이버 모바일 블로그
          // S4-1. RSS 파싱이 불가능해 데스크탑 버전으로부터 파싱
          let parsedFeedUrl;
          const mobileNaverUniqueId = params.url
            .split('m.blog.naver.com/')
            .reverse()[0]
            .split('/')[0];

          parsedFeedUrl = await this.getRssAddress(
            `https://blog.naver.com/${mobileNaverUniqueId}`,
          );

          if (parsedFeedUrl.statusCode === 200) {
            // S4-2. 파싱한 RSS 주소를 통하여 재시도
            return (rssData = await this.register({
              url: parsedFeedUrl.feedUrl,
              loggedUser: params.loggedUser,
            }));
          } else {
            throw new Error();
          }
        } else if (params.url.toLowerCase().includes('blog.naver.com')) {
          // S5. 네이버 블로그
          // S5-1. 고유 아이디 파싱 후 데스크탑 버전에서 파싱
          let parsedFeedUrl;
          const naverUniqueId = params.url
            .split('blog.naver.com/')
            .reverse()[0]
            .split('/')[0];

          parsedFeedUrl = await this.getRssAddress(
            `https://blog.naver.com/${naverUniqueId}`,
          );

          if (parsedFeedUrl.statusCode === 200) {
            // S5-2. 파싱한 RSS 주소를 통하여 재시도
            return (rssData = await this.register({
              url: parsedFeedUrl.feedUrl,
              loggedUser: params.loggedUser,
            }));
          } else {
            throw new Error();
          }
        } else if (params.url.toLowerCase().includes('medium.com')) {
          // S6. 미디움
          let parsedFeedUrl;

          // S6-1. 최상위 경로로 이동하여야 함.
          const mediumUniqueId = params.url
            .split('medium.com/')
            .reverse()[0]
            .split('/')[0];

          // S6-2. 최상위 경로로 이동 후 다시 한번 파싱을 시도함
          parsedFeedUrl = await this.getRssAddress(
            `https://medium.com/${mediumUniqueId}`,
          );

          if (parsedFeedUrl.statusCode === 200) {
            // S6-3. 파싱한 RSS 주소를 통하여 재시도
            return (rssData = await this.register({
              url: parsedFeedUrl.feedUrl,
              loggedUser: params.loggedUser,
            }));
          } else {
            throw new Error();
          }
        }
      }

      if (rssData.statusCode === 200) {
        // 중복 확인
        const existFeedUrl = await this.subscribeds.findOne({
          owner: params.loggedUser,
          feedUrl: rssData.data.feedUrl,
        });

        if (existFeedUrl) {
          return {
            statusCode: 409,
            message: '이미 구독 중인 주소입니다!',
            error: 'This address is already subscribed',
          };
        } else {
          await this.subscribeds.save({
            ...rssData.data,
            owner: params.loggedUser,
          });
        }

        return rssData;
      } else {
        throw new Error();
      }
    } catch (error) {
      console.log(error);
      return {
        statusCode: 500,
        message: '주소 등록에 실패하였습니다.',
        error: "Couldn't regist content's address",
      };
    }

    //const existRegist = await this.subscribeds.findOne({});
  }
}
