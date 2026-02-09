import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { CreateCommentDto } from "./dto/create-comment.dto";

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(postSlug: string, dto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({
      where: { slug: postSlug },
    });

    if (!post) {
      throw new NotFoundException(`Post with slug ${postSlug} not found`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent || parent.postId !== post.id) {
        throw new NotFoundException("Parent comment not found");
      }
    }

    return this.prisma.comment.create({
      data: {
        postId: post.id,
        name: dto.name,
        email: dto.email,
        content: dto.content,
        parentId: dto.parentId,
        isApproved: false,
      },
    });
  }

  async findByPostSlug(postSlug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug: postSlug },
    });

    if (!post) {
      throw new NotFoundException(`Post with slug ${postSlug} not found`);
    }

    const comments = await this.prisma.comment.findMany({
      where: {
        postId: post.id,
        isApproved: true,
      },
      orderBy: { createdAt: "asc" },
      include: {
        replies: {
          where: { isApproved: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return comments.filter((c) => !c.parentId);
  }

  async findAll() {
    return this.prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });
  }

  async approve(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return this.prisma.comment.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  async delete(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return this.prisma.comment.delete({ where: { id } });
  }
}
