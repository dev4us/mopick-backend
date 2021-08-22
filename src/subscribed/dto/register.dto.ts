import { commonResponseDto } from 'src/common/common.dto';
import { User } from 'src/user/user.entity';

export class registerRequestDto {
  url: string;
  //loggedUserId: number;
  loggedUser: User;
  serviceOn: string | null;
}

export class getRssAddressResponseDto extends commonResponseDto {
  feedUrl: string;
}

export class getProfileAddressResponseDto extends commonResponseDto {
  profileUrl: string | null;
}

export class parsingRSSResponseDto extends commonResponseDto {
  data?: {
    title: string;
    siteUrl: string;
    serviceOn: string | null;
    feedUrl: string;
    profileImageUrl: string | null;
  };
}
