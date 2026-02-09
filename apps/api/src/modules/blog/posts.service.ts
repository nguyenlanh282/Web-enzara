import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { PostFilterDto } from "./dto/post-filter.dto";
import { PostStatus } from "@prisma/client";

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(dto: CreatePostDto, authorId: string) {
    const slug = await this.ensureUniqueSlug(this.generateSlug(dto.title));
    const readingTime = this.calculateReadingTime(dto.content);
    const publishedAt =
      dto.status === PostStatus.PUBLISHED
        ? dto.publishedAt
          ? new Date(dto.publishedAt)
          : new Date()
        : null;

    return this.prisma.post.create({
      data: {
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        content: dto.content,
        featuredImage: dto.featuredImage,
        categoryId: dto.categoryId,
        authorId,
        status: dto.status || PostStatus.DRAFT,
        tags: dto.tags || [],
        readingTime,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        publishedAt,
      },
      include: {
        category: true,
      },
    });
  }

  async updatePost(id: string, dto: UpdatePostDto) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    const readingTime =
      dto.content && dto.content !== existing.content
        ? this.calculateReadingTime(dto.content)
        : existing.readingTime;

    const publishedAt =
      dto.status === PostStatus.PUBLISHED && !existing.publishedAt
        ? dto.publishedAt
          ? new Date(dto.publishedAt)
          : new Date()
        : existing.publishedAt;

    return this.prisma.post.update({
      where: { id },
      data: {
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
        featuredImage: dto.featuredImage,
        categoryId: dto.categoryId,
        status: dto.status,
        tags: dto.tags,
        readingTime,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        publishedAt,
      },
      include: {
        category: true,
      },
    });
  }

  async findAll(filter: PostFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.categoryId) {
      where.categoryId = filter.categoryId;
    }
    if (filter.search) {
      where.title = { contains: filter.search, mode: "insensitive" };
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          _count: {
            select: { comments: true },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllSlugs(): Promise<string[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        publishedAt: { lte: new Date() },
      },
      select: { slug: true },
    });
    return posts.map((p) => p.slug);
  }

  async findPublished(filter: PostFilterDto & { categorySlug?: string }) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      status: PostStatus.PUBLISHED,
      publishedAt: { lte: new Date() },
    };

    if (filter.categorySlug) {
      where.category = { slug: filter.categorySlug };
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
        include: {
          category: true,
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        category: true,
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: {
        slug,
        status: PostStatus.PUBLISHED,
        publishedAt: { lte: new Date() },
      },
      include: {
        category: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with slug ${slug} not found`);
    }

    return post;
  }

  async findRecent(limit: number = 4) {
    return this.prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        publishedAt: { lte: new Date() },
      },
      take: limit,
      orderBy: { publishedAt: "desc" },
      include: {
        category: true,
      },
    });
  }

  async findPopular(limit: number = 4) {
    return this.prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        publishedAt: { lte: new Date() },
      },
      take: limit,
      orderBy: { viewCount: "desc" },
      include: {
        category: true,
      },
    });
  }

  async incrementViewCount(slug: string) {
    await this.prisma.post.updateMany({
      where: { slug },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  async deletePost(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return this.prisma.post.delete({ where: { id } });
  }

  calculateReadingTime(html: string): number {
    const text = html.replace(/<[^>]*>/g, "");
    const wordCount = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 200);
    return Math.max(1, minutes);
  }

  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 2;

    while (await this.prisma.post.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
