import {
  Injectable,
  Inject,
  forwardRef,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { PrismaService } from "../../common/services/prisma.service";
import { EmailService } from "../notifications/email.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import {
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
  ChangePasswordDto,
  CreateAddressDto,
  UpdateAddressDto,
} from "./dto";
import { UserRole } from "@prisma/client";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    @Inject(forwardRef(() => LoyaltyService))
    private loyaltyService: LoyaltyService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException("Email đã được sử dụng");
    }

    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictException("Số điện thoại đã được sử dụng");
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        fullName: dto.fullName,
        phone: dto.phone,
        role: UserRole.CUSTOMER,
      },
    });

    // Send welcome email (non-blocking)
    this.emailService
      .sendEmail(
        user.email,
        "Chao mung den voi Enzara",
        this.emailService.welcomeHtml(user.fullName),
      )
      .catch((err) => {
        this.logger.error("Failed to send welcome email:", err);
      });

    // Generate email verification token
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const hashedVerifyToken = crypto
      .createHash("sha256")
      .update(verifyToken)
      .digest("hex");

    // Store hashed verification token in Setting table
    await this.prisma.setting.upsert({
      where: { group_key: { group: "email_verify", key: user.id } },
      update: {
        value: {
          token: hashedVerifyToken,
          expiresAt: Date.now() + 86400000,
        },
      },
      create: {
        group: "email_verify",
        key: user.id,
        value: {
          token: hashedVerifyToken,
          expiresAt: Date.now() + 86400000,
        },
      },
    });

    // Send verification email (non-blocking)
    const frontendUrl =
      this.configService.get("FRONTEND_URL") || "http://localhost:3000";
    const verifyUrl = `${frontendUrl}/auth/verify-email?token=${verifyToken}&email=${encodeURIComponent(user.email)}`;
    this.emailService
      .sendEmail(
        user.email,
        "Xac minh email - Enzara",
        this.emailService.emailVerificationHtml(verifyUrl),
      )
      .catch((err) => {
        this.logger.error("Failed to send verification email:", err);
      });

    // Award registration loyalty points
    await this.prisma.loyaltyPoint.create({
      data: {
        userId: user.id,
        points: 100,
        type: "EARN",
        description: "Dang ky tai khoan",
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException("Phiên đăng nhập hết hạn");
    }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) return { message: "Nếu email tồn tại, bạn sẽ nhận được email đặt lại mật khẩu" };

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Store hashed reset token in user metadata (using a Setting as temp storage)
    await this.prisma.setting.upsert({
      where: { group_key: { group: "password_reset", key: user.id } },
      update: {
        value: { token: hashedToken, expiresAt: Date.now() + 3600000 }, // 1 hour
      },
      create: {
        group: "password_reset",
        key: user.id,
        value: { token: hashedToken, expiresAt: Date.now() + 3600000 },
      },
    });

    // Send password reset email
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;
    const html = this.emailService.passwordResetHtml(resetUrl);
    this.emailService.sendEmail(email, 'Dat lai mat khau - Enzara', html).catch((err) => {
      this.logger.error('Failed to send password reset email:', err);
    });

    // Log token in development for debugging
    if (this.configService.get("NODE_ENV") !== "production") {
      this.logger.debug(`Password reset token for ${email}: ${resetToken}`);
    }

    return { message: "Nếu email tồn tại, bạn sẽ nhận được email đặt lại mật khẩu" };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find the reset token in settings
    const resetSettings = await this.prisma.setting.findMany({
      where: { group: "password_reset" },
    });

    const validReset = resetSettings.find((s) => {
      const data = s.value as any;
      return data.token === hashedToken && data.expiresAt > Date.now();
    });

    if (!validReset) {
      throw new BadRequestException("Token không hợp lệ hoặc đã hết hạn");
    }

    const userId = validReset.key;
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      }),
      this.prisma.setting.delete({
        where: { id: validReset.id },
      }),
    ]);

    return { message: "Mật khẩu đã được đặt lại thành công" };
  }

  async verifyEmail(token: string, email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException("Token khong hop le hoac da het han");
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const verifySetting = await this.prisma.setting.findUnique({
      where: { group_key: { group: "email_verify", key: user.id } },
    });

    if (!verifySetting) {
      throw new BadRequestException("Token khong hop le hoac da het han");
    }

    const data = verifySetting.value as any;
    if (data.token !== hashedToken || data.expiresAt < Date.now()) {
      throw new BadRequestException("Token khong hop le hoac da het han");
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
      this.prisma.setting.delete({
        where: { id: verifySetting.id },
      }),
    ]);

    return { message: "Email da duoc xac minh thanh cong" };
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("Khong tim thay tai khoan");
    }

    if (user.emailVerified) {
      throw new BadRequestException("Email da duoc xac minh");
    }

    // Rate limit: check if last token was sent less than 5 minutes ago
    const existingSetting = await this.prisma.setting.findUnique({
      where: { group_key: { group: "email_verify", key: user.id } },
    });

    if (existingSetting) {
      const data = existingSetting.value as any;
      const tokenAge = Date.now() - (data.expiresAt - 86400000);
      if (tokenAge < 300000) {
        throw new BadRequestException(
          "Vui long doi 5 phut truoc khi gui lai email xac minh",
        );
      }
    }

    // Generate new verification token
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const hashedVerifyToken = crypto
      .createHash("sha256")
      .update(verifyToken)
      .digest("hex");

    await this.prisma.setting.upsert({
      where: { group_key: { group: "email_verify", key: user.id } },
      update: {
        value: {
          token: hashedVerifyToken,
          expiresAt: Date.now() + 86400000,
        },
      },
      create: {
        group: "email_verify",
        key: user.id,
        value: {
          token: hashedVerifyToken,
          expiresAt: Date.now() + 86400000,
        },
      },
    });

    const frontendUrl =
      this.configService.get("FRONTEND_URL") || "http://localhost:3000";
    const verifyUrl = `${frontendUrl}/auth/verify-email?token=${verifyToken}&email=${encodeURIComponent(user.email)}`;

    this.emailService
      .sendEmail(
        user.email,
        "Xac minh email - Enzara",
        this.emailService.emailVerificationHtml(verifyUrl),
      )
      .catch((err) => {
        this.logger.error("Failed to send verification email:", err);
      });

    return { message: "Email xac minh da duoc gui lai" };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) throw new UnauthorizedException();
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone && existingPhone.id !== userId) {
        throw new ConflictException("So dien thoai da duoc su dung");
      }
    }

    const updateData: Record<string, string> = {};
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new BadRequestException("Khong the doi mat khau");
    }

    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isCurrentValid) {
      throw new BadRequestException("Mat khau hien tai khong dung");
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: "Doi mat khau thanh cong" };
  }

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const existingAddresses = await this.prisma.address.count({
      where: { userId },
    });

    const shouldBeDefault = dto.isDefault || existingAddresses === 0;

    if (shouldBeDefault) {
      // Reset all other defaults
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        userId,
        fullName: dto.fullName,
        phone: dto.phone,
        province: dto.province,
        district: dto.district,
        ward: dto.ward,
        address: dto.address,
        isDefault: shouldBeDefault,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException("Dia chi khong ton tai");
    }

    if (address.userId !== userId) {
      throw new ForbiddenException("Khong co quyen truy cap dia chi nay");
    }

    const updateData: Record<string, unknown> = {};
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.province !== undefined) updateData.province = dto.province;
    if (dto.district !== undefined) updateData.district = dto.district;
    if (dto.ward !== undefined) updateData.ward = dto.ward;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault;

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: updateData,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException("Dia chi khong ton tai");
    }

    if (address.userId !== userId) {
      throw new ForbiddenException("Khong co quyen truy cap dia chi nay");
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    // If it was default, set the next one as default
    if (address.isDefault) {
      const nextAddress = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (nextAddress) {
        await this.prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: "Xoa dia chi thanh cong" };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException("Dia chi khong ton tai");
    }

    if (address.userId !== userId) {
      throw new ForbiddenException("Khong co quyen truy cap dia chi nay");
    }

    // Unset all other defaults
    await this.prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Set this one as default
    return this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }

  private generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>("JWT_EXPIRATION", "15m"),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRATION", "7d"),
    });

    return { accessToken, refreshToken };
  }
}
