import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { join } from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./modules/auth/auth.module";
import { CmsModule } from "./modules/cms/cms.module";
import { ProductsModule } from "./modules/products/products.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { PancakeModule } from "./modules/pancake/pancake.module";
import { BlogModule } from "./modules/blog/blog.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { MarketingModule } from "./modules/marketing/marketing.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { WishlistModule } from "./modules/wishlist/wishlist.module";
import { LoyaltyModule } from "./modules/loyalty/loyalty.module";
import { AdminCustomersModule } from "./modules/admin-customers/admin-customers.module";
import { ShippingModule } from "./modules/shipping/shipping.module";
import { PrismaService } from "./common/services/prisma.service";
import { LoggerMiddleware } from "./common/middleware/logger.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
        maxAge: 86400000, // 1 day cache
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    CmsModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    PancakeModule,
    BlogModule,
    ReviewsModule,
    MarketingModule,
    NotificationsModule,
    AnalyticsModule,
    WishlistModule,
    LoyaltyModule,
    AdminCustomersModule,
    ShippingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
