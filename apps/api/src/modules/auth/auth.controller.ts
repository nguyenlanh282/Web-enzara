import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  UpdateProfileDto,
  ChangePasswordDto,
  CreateAddressDto,
  UpdateAddressDto,
} from "./dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900000, limit: 5 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/api/auth/refresh",
    });

    return { accessToken };
  }

  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.register(dto);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth/refresh",
    });

    return { accessToken };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(HttpStatus.UNAUTHORIZED).json({ message: "No refresh token" });
      return;
    }

    const { accessToken, refreshToken } = await this.authService.refreshToken(token);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth/refresh",
    });

    return { accessToken };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
    return { message: "Đăng xuất thành công" };
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token, dto.email);
  }

  @Post("resend-verification")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resendVerification(@CurrentUser("id") userId: string) {
    return this.authService.resendVerification(userId);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser("id") userId: string) {
    return this.authService.getProfile(userId);
  }

  // Profile endpoints
  @Patch("profile")
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, dto);
  }

  @Patch("password")
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser("id") userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  // Address endpoints
  @Get("addresses")
  @UseGuards(JwtAuthGuard)
  async getAddresses(@CurrentUser("id") userId: string) {
    return this.authService.getAddresses(userId);
  }

  @Post("addresses")
  @UseGuards(JwtAuthGuard)
  async createAddress(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.authService.createAddress(userId, dto);
  }

  @Patch("addresses/:id")
  @UseGuards(JwtAuthGuard)
  async updateAddress(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.authService.updateAddress(userId, id, dto);
  }

  @Delete("addresses/:id")
  @UseGuards(JwtAuthGuard)
  async deleteAddress(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ) {
    return this.authService.deleteAddress(userId, id);
  }

  @Patch("addresses/:id/default")
  @UseGuards(JwtAuthGuard)
  async setDefaultAddress(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ) {
    return this.authService.setDefaultAddress(userId, id);
  }
}
