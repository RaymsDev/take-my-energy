import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleUser } from './auth.types';

const mockAuthService = () => ({
  handleGoogleCallback: jest.fn(),
});

const mockConfigService = (frontendUrl: string) => ({
  get: jest.fn((key: string) => {
    if (key === 'FRONTEND_URL') return frontendUrl;
    return undefined;
  }),
});

const mockRes = () => {
  const res = { redirect: jest.fn() } as unknown as Response;
  return res;
};

const makeReq = (user: Partial<GoogleUser>) =>
  ({ user }) as { user: GoogleUser };

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceSpy: ReturnType<typeof mockAuthService>;
  let configSpy: ReturnType<typeof mockConfigService>;

  beforeEach(async () => {
    authServiceSpy = mockAuthService();
    configSpy = mockConfigService('http://localhost:4200');

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ConfigService, useValue: configSpy },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  describe('googleCallback', () => {
    it('redirects to FRONTEND_URL/admin#access_token=... for an allowlisted user', async () => {
      authServiceSpy.handleGoogleCallback.mockResolvedValue({
        access_token: 'test-jwt',
      });
      const res = mockRes();

      await controller.googleCallback(
        makeReq({ email: 'admin@example.com', googleId: 'g1', name: 'Admin' }),
        res,
      );

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:4200/admin#access_token=test-jwt',
      );
    });

    it('Location contains /admin#access_token= (fragment, not query param)', async () => {
      authServiceSpy.handleGoogleCallback.mockResolvedValue({
        access_token: 'mytoken',
      });
      const res = mockRes();

      await controller.googleCallback(
        makeReq({ email: 'admin@example.com', googleId: 'g1', name: 'Admin' }),
        res,
      );

      const redirectArg = (res.redirect as jest.Mock).mock
        .calls[0][0] as string;
      expect(redirectArg).toContain('/admin#access_token=');
      expect(redirectArg).not.toContain('?access_token=');
    });

    it('propagates ForbiddenException when email is not allowlisted', async () => {
      authServiceSpy.handleGoogleCallback.mockRejectedValue(
        new ForbiddenException('Email not authorized'),
      );
      const res = mockRes();

      await expect(
        controller.googleCallback(
          makeReq({
            email: 'other@example.com',
            googleId: 'g2',
            name: 'Other',
          }),
          res,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('does not import fs or path (no file-write side effect)', () => {
      const src = require('fs').readFileSync(
        require('path').join(__dirname, 'auth.controller.ts'),
        'utf8',
      );
      expect(src).not.toContain('import * as fs');
      expect(src).not.toContain('import * as path');
      expect(src).not.toContain('writeFileSync');
    });
  });
});
