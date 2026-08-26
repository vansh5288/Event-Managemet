import jwt from 'jsonwebtoken';
import { config } from '../config';

export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtRefreshExpiresIn as any,
  });
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const verifyToken = (token: string): { userId: string; role?: string } => {
  return jwt.verify(token, config.jwtSecret) as { userId: string; role?: string };
};
