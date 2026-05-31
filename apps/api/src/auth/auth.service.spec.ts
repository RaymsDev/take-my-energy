import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';

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
});
