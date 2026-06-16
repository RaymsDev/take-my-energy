import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as fs from 'fs';
import { AuthService } from './auth.service';

jest.mock('fs');

const mockConfig = (allowlist: string) => ({
  get: jest.fn((key: string) => {
    if (key === 'ADMIN_ALLOWLIST_EMAILS') return allowlist;
    return undefined;
  }),
});

const mockJwt = () => ({
  signAsync: jest.fn().mockResolvedValue('signed-token'),
});

describe('AuthService', () => {
  let service: AuthService;
  let configSpy: ReturnType<typeof mockConfig>;
  let jwtSpy: ReturnType<typeof mockJwt>;

  const rebuild = async (allowlist: string) => {
    configSpy = mockConfig(allowlist);
    jwtSpy = mockJwt();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: configSpy },
        { provide: JwtService, useValue: jwtSpy },
      ],
    }).compile();
    service = module.get(AuthService);
  };

  describe('handleGoogleCallback', () => {
    it('returns access_token for an allowlisted email', async () => {
      await rebuild('admin@example.com');
      const result = await service.handleGoogleCallback(
        'admin@example.com',
        'google-123',
        'Admin User',
      );
      expect(result).toEqual({ access_token: 'signed-token' });
      expect(jwtSpy.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'admin@example.com', role: 'admin' }),
      );
    });

    it('throws ForbiddenException for a non-allowlisted email', async () => {
      await rebuild('admin@example.com');
      await expect(
        service.handleGoogleCallback(
          'other@example.com',
          'google-999',
          'Other',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws ForbiddenException when email is undefined', async () => {
      await rebuild('admin@example.com');
      await expect(
        service.handleGoogleCallback(undefined, 'google-123', 'No Email User'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('trims whitespace from allowlist entries', async () => {
      await rebuild('  admin@example.com  , other@example.com  ');
      await expect(
        service.handleGoogleCallback(
          'admin@example.com',
          'google-123',
          'Admin',
        ),
      ).resolves.toHaveProperty('access_token');
    });

    it('performs case-insensitive comparison', async () => {
      await rebuild('Admin@Example.COM');
      await expect(
        service.handleGoogleCallback(
          'admin@example.com',
          'google-123',
          'Admin',
        ),
      ).resolves.toHaveProperty('access_token');
    });
  });

  describe('dev token sync', () => {
    const originalEnv = process.env['NODE_ENV'];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      process.env['NODE_ENV'] = originalEnv;
    });

    it('writes the token to requests/.env.dev in development', async () => {
      process.env['NODE_ENV'] = 'development';
      (fs.readFileSync as jest.Mock).mockReturnValue(
        'BASE_URL=http://localhost:3000\nACCESS_TOKEN=\n',
      );
      await rebuild('admin@example.com');

      await service.handleGoogleCallback('admin@example.com', 'g1', 'Admin');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('requests/.env.dev'),
        'BASE_URL=http://localhost:3000\nACCESS_TOKEN=signed-token\n',
      );
    });

    it('does not write the token outside development', async () => {
      process.env['NODE_ENV'] = 'production';
      await rebuild('admin@example.com');

      await service.handleGoogleCallback('admin@example.com', 'g1', 'Admin');

      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('does not throw when the env file is missing', async () => {
      process.env['NODE_ENV'] = 'development';
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('ENOENT');
      });
      await rebuild('admin@example.com');

      await expect(
        service.handleGoogleCallback('admin@example.com', 'g1', 'Admin'),
      ).resolves.toHaveProperty('access_token');
    });
  });
});
