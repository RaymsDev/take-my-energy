import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './auth.service';

interface GoogleUser {
  googleId: string;
  email?: string;
  name: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport redirects to Google — body never reached
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request & { user: GoogleUser }) {
    return this.authService.handleGoogleCallback(
      req.user.email,
      req.user.googleId,
      req.user.name,
    );
  }
}
