import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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

    if (process.env['NODE_ENV'] === 'development') {
      this.syncTokenToDevEnv(access_token);
    }

    return { access_token };
  }

  private syncTokenToDevEnv(token: string): void {
    try {
      const envPath = join(process.cwd(), 'requests', '.env.dev');
      const current = readFileSync(envPath, 'utf8');
      const updated = current.replace(
        /^ACCESS_TOKEN=.*$/m,
        `ACCESS_TOKEN=${token}`,
      );
      writeFileSync(envPath, updated);
    } catch (err) {
      this.logger.warn(`Could not sync token to requests/.env.dev: ${err}`);
    }
  }
}
