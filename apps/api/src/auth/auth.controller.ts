import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport redirects to Google — body never reached
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: GoogleUser },
    @Res() res: Response,
  ) {
    const result = await this.authService.handleGoogleCallback(
      req.user.email,
      req.user.googleId,
      req.user.name,
    );

    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    res.redirect(`${frontendUrl}/admin#access_token=${result.access_token}`);
  }
}
