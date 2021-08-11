import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const LoggedUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const { headers } = context.switchToHttp().getRequest();
    //return headers['loggedUserId'];
    return headers['loggedUser'];
  },
);
