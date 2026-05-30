import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async handleGoogleCallback(
    email: string | undefined,
    googleId: string,
    name: string,
  ): Promise<{ access_token: string }> {
    if (email == null) {
      throw new ForbiddenException('Email not available from Google profile');
    }

    const allowlist = (this.config.get<string>('ADMIN_ALLOWLIST_EMAILS') ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!allowlist.includes(email.toLowerCase())) {
      throw new ForbiddenException('Email not authorized');
    }

    const access_token = await this.jwt.signAsync({
      sub: googleId,
      email,
      name,
      role: 'admin',
    });

    return { access_token };
  }
}
