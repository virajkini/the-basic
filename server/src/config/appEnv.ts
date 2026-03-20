const rawAppEnv = (process.env.APP_ENV || '').trim().toLowerCase();

export const APP_ENV = rawAppEnv === 'stage' ? 'stage' : 'prod';
export const IS_STAGE = APP_ENV === 'stage';

export const DEFAULT_DB_NAME = IS_STAGE ? 'amgeljodi_stage' : 'amgeljodi';
export const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME;

export const STAGE_OTP_CODE = process.env.STAGE_OTP_CODE || '1111';
