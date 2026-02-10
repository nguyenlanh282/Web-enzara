import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsPublicController } from "./products-public.controller";
import { ProductsService } from "./products.service";
import { CategoriesAdminController, CategoriesPublicController } from "./categories.controller";
import { CategoriesService } from "./categories.service";
import { BrandsAdminController, BrandsPublicController } from "./brands.controller";
import { BrandsService } from "./brands.service";
import { PrismaService } from "../../common/services/prisma.service";
import { AuthModule } from "../auth/auth.module";
import { PancakeModule } from "../pancake/pancake.module";
import { InventoryController } from "./inventory.controller";

@Module({
  imports: [AuthModule, PancakeModule],
  controllers: [
    ProductsController,
    ProductsPublicController,
    CategoriesAdminController,
    CategoriesPublicController,
    BrandsAdminController,
    BrandsPublicController,
    InventoryController,
  ],
  providers: [ProductsService, CategoriesService, BrandsService, PrismaService],
  exports: [ProductsService, CategoriesService, BrandsService],
})
export class ProductsModule {}
