import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductFilterDto } from "./dto/product-filter.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { CacheInvalidationService } from "../../common/services/cache-invalidation.service";

@Controller("admin/products")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  @Get()
  findAll(@Query() filter: ProductFilterDto) {
    return this.productsService.findAllAdmin(filter);
  }

  @Get("export")
  async exportCsv(@Res() res: Response) {
    const csv = await this.productsService.exportCsv();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=products.csv",
    );
    // Add BOM for Excel UTF-8 compatibility
    res.send("\uFEFF" + csv);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productsService.findOneAdmin(id);
  }

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    const result = await this.productsService.create(createProductDto);
    await this.cacheInvalidation.invalidateProducts();
    return result;
  }

  @Post("import")
  @Roles(UserRole.ADMIN)
  async importCsv(@Body() body: { csvContent: string }) {
    const result = await this.productsService.importCsv(body.csvContent);
    await this.cacheInvalidation.invalidateProducts();
    return result;
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() updateProductDto: UpdateProductDto) {
    const result = await this.productsService.update(id, updateProductDto);
    await this.cacheInvalidation.invalidateProducts();
    return result;
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  async remove(@Param("id") id: string) {
    const result = await this.productsService.remove(id);
    await this.cacheInvalidation.invalidateProducts();
    return result;
  }
}
