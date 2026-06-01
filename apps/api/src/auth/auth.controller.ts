import { Controller, Get, Logger, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AuthService } from './auth.service';
import { GoogleUser } from './auth.types';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport redirects to Google — body never reached
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request & { user: GoogleUser }) {
    const result = await this.authService.handleGoogleCallback(
      req.user.email,
      req.user.googleId,
      req.user.name,
    );

    if (process.env['NODE_ENV'] !== 'production') {
      const envFile = path.join(process.cwd(), 'requests', '.env.dev');
      const content = `BASE_URL=http://localhost:3000\nACCESS_TOKEN=${result.access_token}\n`;
      fs.writeFileSync(envFile, content, 'utf8');
      this.logger.log(`ACCESS_TOKEN saved to ${envFile}`);
    }

    return result;
  }
}
