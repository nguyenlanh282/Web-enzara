import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";
import { PagesController } from "./pages.controller";
import { PagesService } from "./pages.service";
import { BannersController } from "./banners.controller";
import { BannersService } from "./banners.service";
import { MenusController } from "./menus.controller";
import { MenusService } from "./menus.service";
import { RedirectsController } from "./redirects.controller";
import { RedirectsService } from "./redirects.service";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";

@Module({
  controllers: [
    SettingsController,
    PagesController,
    BannersController,
    MenusController,
    RedirectsController,
    MediaController,
  ],
  providers: [
    PrismaService,
    SettingsService,
    PagesService,
    BannersService,
    MenusService,
    RedirectsService,
    MediaService,
  ],
  exports: [SettingsService],
})
export class CmsModule {}
