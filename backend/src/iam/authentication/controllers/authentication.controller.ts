import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
  Inject,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthenticationService } from '../services';
import { SignUpDto } from '../dto/sign-up.dto';
import { SignInDto } from '../dto/sign-in.dto';
import { Public } from '../decorators';
import { Logger } from 'nestjs-pino';
import { IAM_ROUTES } from '../../../common/types';
import { IMessageConstant } from '../../../common/types';
import { IDENTIFIERS } from '../../../shared';
import { IJwtConfiguration, jwtConfiguration } from '../../../configuration';
import { RefreshTokenGuard } from '../guard';
import { ActiveUser } from '../../decorators';
import { IActiveUserData } from '../../interfaces';

interface RequestWithCookies {
  cookies?: {
    access_token?: string;
    refresh_token?: string;
  };
}

@Controller(IAM_ROUTES.IAM_PREFIX)
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly logger: Logger,
    @Inject(IDENTIFIERS.WARN)
    private readonly warn: IMessageConstant,
    @Inject(IDENTIFIERS.INFO)
    private readonly info: IMessageConstant,
    @Inject(IDENTIFIERS.IAM_ROUTES)
    private readonly iamRoutes: IMessageConstant,
    @Inject(jwtConfiguration.KEY)
    private readonly jwtConfig: IJwtConfiguration,
  ) {}

  @Public()
  @Post(IAM_ROUTES.SIGN_UP)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
  signUp(@Body() signUpDto: SignUpDto) {
    this.logger.log(this.info.REQUEST_TO_SIGN_UP, signUpDto);
    return this.authenticationService.signUp(signUpDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(IAM_ROUTES.SIGN_IN)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
  public async signIn(
    @Res({ passthrough: true }) response: Response,
    @Body() signInDto: SignInDto,
  ) {
    this.logger.log(this.info.REQUEST_TO_SIGN_IN);
    return await this.authenticationService.signIn(signInDto, response);
  }

  @Post(IAM_ROUTES.SIGN_OUT)
  @HttpCode(HttpStatus.OK)
  public async signOut(@Res({ passthrough: true }) response: Response) {
    this.logger.log(this.info.REQUEST_TO_SIGN_OUT);

    // Получаем токены из cookies
    const request = response.req as RequestWithCookies;
    const accessToken = request.cookies?.access_token;
    const refreshToken = request.cookies?.refresh_token;

    return await this.authenticationService.signOut(
      response,
      accessToken,
      refreshToken,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post(IAM_ROUTES.REFRESH_TOKENS)
  @UseGuards(RefreshTokenGuard)
  public async refreshToken(
    @Res({ passthrough: true }) response: Response,
    @ActiveUser() user: IActiveUserData,
  ) {
    this.logger.log(this.info.REQUEST_TO_REFRESH_TOKEN);
    return await this.authenticationService.refreshTokenByUserId(
      user.sub,
      response,
    );
  }
}
