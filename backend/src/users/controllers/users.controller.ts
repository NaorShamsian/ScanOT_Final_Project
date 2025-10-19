import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  ForbiddenException,
  ValidationPipe,
  UsePipes,
  Query,
  Inject,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { ActiveUser, IActiveUserData, Public } from '../../iam';
import { USERS_ROUTES } from '../../common/types';
import { IMessageConstant } from '../../common/types';
import { IDENTIFIERS } from '../../shared';

@Controller(USERS_ROUTES.USERS_PREFIX)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: Logger,
    @Inject(IDENTIFIERS.INFO)
    private readonly info: IMessageConstant,
    @Inject(IDENTIFIERS.WARN)
    private readonly warn: IMessageConstant,
  ) {}
  @Public()
  @Get(USERS_ROUTES.FIND_ALL_USERS_PAGINATED)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
  async findAll(@Query() paginationDto: PaginationDto) {
    this.logger.log(
      this.info.REQUEST_TO_FIND_ALL_USERS_PAGINATED,
      paginationDto,
    );
    return await this.usersService.findAllPaginated(
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @Public()
  @Get(USERS_ROUTES.FIND_USER)
  public async findOne(@Param('id') id: string) {
    this.logger.log(this.info.REQUEST_TO_FIND_USER, { userId: id });
    return this.usersService.findOne(id);
  }

  @Patch(USERS_ROUTES.UPDATE_USER)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
  public async update(
    @Param('id') id: string,
    @ActiveUser() user: IActiveUserData,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    this.logger.log(this.info.REQUEST_TO_UPDATE_USER, {
      userId: id,
      updateData: updateUserDto,
    });
    if (user.sub !== id) {
      throw new ForbiddenException(
        this.warn.YOU_CAN_ONLY_UPDATE_YOUR_OWN_ACCOUNT,
      );
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(USERS_ROUTES.DELETE_USER)
  public async remove(
    @Param('id') id: string,
    @ActiveUser() user: IActiveUserData,
  ) {
    this.logger.log(this.info.REQUEST_TO_DELETE_USER, { userId: id });
    if (user.sub !== id) {
      throw new ForbiddenException(
        this.warn.YOU_CAN_ONLY_UPDATE_YOUR_OWN_ACCOUNT,
      );
    }
    return this.usersService.remove(id);
  }
}
