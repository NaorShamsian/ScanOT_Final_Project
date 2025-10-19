import { IMessageConstant } from './message.constant.interface';

export const WARN: IMessageConstant = {
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  USER_WRONG_CREDENTIALS: 'User wrong credentials',
  YOU_CAN_ONLY_UPDATE_YOUR_OWN_ACCOUNT: 'You can only update your own account',
  YOU_CAN_ONLY_DELETE_YOUR_OWN_ACCOUNT: 'You can only delete your own account',
  USER_PASSWORD_UPDATE_FAILED: 'User password update failed',
  USER_PASSWORD_UPDATE_FAILED_WITH_NEW_PASSWORD:
    'User password update failed with new password',
  REFRESH_TOKEN_REQUIRED: 'Refresh token is required',
};
