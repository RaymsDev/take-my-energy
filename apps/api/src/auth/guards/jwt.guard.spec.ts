import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { JwtGuard } from './jwt.guard';

const makeContext = (authHeader?: string): ExecutionContext => {
  const request = { headers: { authorization: authHeader } };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
};

describe('JwtGuard', () => {
  let guard: JwtGuard;
  let jwtService: { verifyAsync: jest.Mock };

  beforeEach(async () => {
    jwtService = { verifyAsync: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        JwtGuard,
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    guard = module.get(JwtGuard);
  });

  it('returns true and populates request.user with a valid token', async () => {
    const payload = { sub: 'google-123', email: 'admin@example.com' };
    jwtService.verifyAsync.mockResolvedValue(payload);
    const ctx = makeContext('Bearer valid-token');
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    const request = ctx.switchToHttp().getRequest() as { user: unknown };
    expect(request.user).toEqual(payload);
  });

  it('throws UnauthorizedException when Authorization header is missing', async () => {
    await expect(guard.canActivate(makeContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when token is invalid', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('expired'));
    await expect(
      guard.canActivate(makeContext('Bearer bad-token')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
