import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadDir = path.resolve(
    __dirname,
    '../../../../uploads',
  );

  constructor(private readonly prisma: PrismaService) {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async findAll(page = 1, limit = 30, folder?: string) {
    const skip = (page - 1) * limit;

    const where = folder ? { folder } : {};

    const [items, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async upload(
    file: Express.Multer.File,
    folder = 'general',
    altText?: string,
  ) {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, path.extname(file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    const timestamp = Date.now();
    const uniqueName = `${baseName}-${timestamp}`;

    // Ensure folder subdirectory
    const folderDir = path.join(this.uploadDir, folder);
    if (!fs.existsSync(folderDir)) {
      fs.mkdirSync(folderDir, { recursive: true });
    }

    const isImage =
      file.mimetype.startsWith('image/') && !file.mimetype.includes('svg');

    if (isImage) {
      try {
        return await this.processAndSaveImage(
          file,
          folderDir,
          folder,
          uniqueName,
          ext,
          altText,
        );
      } catch (error) {
        this.logger.warn(
          `Sharp processing failed for "${file.originalname}", saving raw file. Error: ${error instanceof Error ? error.message : error}`,
        );
        // Fall back to saving the raw file
        return this.saveRawFile(
          file,
          folderDir,
          folder,
          uniqueName,
          ext,
          altText,
        );
      }
    }

    // Non-image: save as-is
    return this.saveRawFile(file, folderDir, folder, uniqueName, ext, altText);
  }

  /**
   * Process an image with Sharp: auto-rotate, resize, compress,
   * generate WebP variant, and generate thumbnails.
   */
  private async processAndSaveImage(
    file: Express.Multer.File,
    folderDir: string,
    folder: string,
    uniqueName: string,
    ext: string,
    altText?: string,
  ) {
    const MAX_WIDTH = 1920;
    const THUMB_WIDTH = 400;

    // Read metadata to determine dimensions
    const metadata = await sharp(file.buffer).metadata();
    const needsResize = metadata.width != null && metadata.width > MAX_WIDTH;

    // ──────────────────────────────────────────────
    // 1. Save optimized original
    // ──────────────────────────────────────────────
    const originalPath = path.join(folderDir, `${uniqueName}${ext}`);

    let pipeline = sharp(file.buffer).rotate(); // auto-rotate EXIF
    if (needsResize) {
      pipeline = pipeline.resize(MAX_WIDTH, null, {
        withoutEnlargement: true,
      });
    }

    if (ext === '.png') {
      await pipeline.png({ compressionLevel: 8 }).toFile(originalPath);
    } else if (ext === '.webp') {
      await pipeline.webp({ quality: 82 }).toFile(originalPath);
    } else {
      // Default to JPEG for .jpg, .jpeg, and other raster formats
      await pipeline.jpeg({ quality: 85 }).toFile(originalPath);
    }

    // ──────────────────────────────────────────────
    // 2. Save WebP version (if original is not already WebP)
    // ──────────────────────────────────────────────
    if (ext !== '.webp') {
      const webpPath = path.join(folderDir, `${uniqueName}.webp`);
      let webpPipeline = sharp(file.buffer).rotate();
      if (needsResize) {
        webpPipeline = webpPipeline.resize(MAX_WIDTH, null, {
          withoutEnlargement: true,
        });
      }
      await webpPipeline.webp({ quality: 82 }).toFile(webpPath);
    }

    // ──────────────────────────────────────────────
    // 3. Save thumbnail in original format
    // ──────────────────────────────────────────────
    const thumbPath = path.join(folderDir, `${uniqueName}-thumb${ext}`);
    let thumbPipeline = sharp(file.buffer)
      .rotate()
      .resize(THUMB_WIDTH, null, { withoutEnlargement: true });

    if (ext === '.png') {
      await thumbPipeline.png({ compressionLevel: 8 }).toFile(thumbPath);
    } else if (ext === '.webp') {
      await thumbPipeline.webp({ quality: 82 }).toFile(thumbPath);
    } else {
      await thumbPipeline.jpeg({ quality: 85 }).toFile(thumbPath);
    }

    // ──────────────────────────────────────────────
    // 4. Save WebP thumbnail (if original is not already WebP)
    // ──────────────────────────────────────────────
    if (ext !== '.webp') {
      const thumbWebpPath = path.join(
        folderDir,
        `${uniqueName}-thumb.webp`,
      );
      await sharp(file.buffer)
        .rotate()
        .resize(THUMB_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(thumbWebpPath);
    }

    // ──────────────────────────────────────────────
    // Read back the optimized file size and dimensions
    // ──────────────────────────────────────────────
    const optimizedMeta = await sharp(originalPath).metadata();
    const optimizedStats = fs.statSync(originalPath);

    const url = `/uploads/${folder}/${uniqueName}${ext}`;

    return this.prisma.media.create({
      data: {
        filename: file.originalname,
        url,
        mimeType: file.mimetype,
        size: optimizedStats.size,
        width: optimizedMeta.width ?? null,
        height: optimizedMeta.height ?? null,
        altText: altText || null,
        folder,
      },
    });
  }

  /**
   * Save a file without any processing (non-image or Sharp fallback).
   */
  private saveRawFile(
    file: Express.Multer.File,
    folderDir: string,
    folder: string,
    uniqueName: string,
    ext: string,
    altText?: string,
  ) {
    const filePath = path.join(folderDir, `${uniqueName}${ext}`);
    fs.writeFileSync(filePath, file.buffer);

    const url = `/uploads/${folder}/${uniqueName}${ext}`;

    return this.prisma.media.create({
      data: {
        filename: file.originalname,
        url,
        mimeType: file.mimetype,
        size: file.size,
        altText: altText || null,
        folder,
      },
    });
  }

  async delete(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media with id "${id}" not found`);
    }

    // Try to delete physical file
    const filePath = path.join(this.uploadDir, '..', media.url);
    try {
      const resolvedPath = path.resolve(filePath);
      if (fs.existsSync(resolvedPath)) {
        fs.unlinkSync(resolvedPath);
      }
    } catch {
      // File may already be deleted, proceed with DB cleanup
    }

    await this.prisma.media.delete({ where: { id } });
    return { message: 'Media deleted successfully' };
  }
}
