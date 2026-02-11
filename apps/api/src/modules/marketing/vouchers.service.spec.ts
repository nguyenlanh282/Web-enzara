import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createTestModule } from '../../../test/helpers';
import { prismaMock } from '../../../test/prisma-mock';
import { VouchersService } from './vouchers.service';

let service: VouchersService;

const mockVoucher = {
  id: 'v1',
  code: 'SAVE20',
  name: 'Save 20%',
  type: 'PERCENTAGE',
  value: 20,
  minOrderAmount: 100000,
  maxDiscount: 50000,
  usageLimit: 100,
  usedCount: 0,
  perUserLimit: 1,
  isActive: true,
  description: null,
  startDate: new Date('2025-01-01'),
  endDate: new Date('2027-12-31'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(async () => {
  const module = await createTestModule({
    providers: [VouchersService],
  });
  service = module.get(VouchersService);
});

describe('VouchersService', () => {
  describe('create', () => {
    it('should create a voucher with a provided code', async () => {
      const dto = {
        code: 'SAVE20',
        name: 'Save 20%',
        type: 'PERCENTAGE',
        value: 20,
        minOrderAmount: 100000,
        maxDiscount: 50000,
        usageLimit: 100,
        perUserLimit: 1,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2027-12-31'),
      };

      prismaMock.voucher.findUnique.mockResolvedValue(null);
      prismaMock.voucher.create.mockResolvedValue(mockVoucher);

      const result = await service.create(dto);

      expect(result).toEqual(mockVoucher);
      expect(prismaMock.voucher.findUnique).toHaveBeenCalledWith({
        where: { code: 'SAVE20' },
      });
      expect(prismaMock.voucher.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if code already exists', async () => {
      const dto = {
        code: 'SAVE20',
        name: 'Save 20%',
        type: 'PERCENTAGE',
        value: 20,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2027-12-31'),
      };

      prismaMock.voucher.findUnique.mockResolvedValue(mockVoucher);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if startDate >= endDate', async () => {
      const dto = {
        code: 'INVALID',
        name: 'Invalid Dates',
        type: 'PERCENTAGE',
        value: 10,
        startDate: new Date('2027-12-31'),
        endDate: new Date('2025-01-01'),
      };

      prismaMock.voucher.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should auto-generate a code if none is provided', async () => {
      const dto = {
        name: 'Auto Code Voucher',
        type: 'PERCENTAGE',
        value: 15,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2027-12-31'),
      };

      prismaMock.voucher.findUnique.mockResolvedValue(null);
      prismaMock.voucher.create.mockResolvedValue({
        ...mockVoucher,
        code: 'AUTO1234',
        name: dto.name,
        value: dto.value,
      });

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(prismaMock.voucher.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated vouchers', async () => {
      const vouchers = [mockVoucher];

      prismaMock.voucher.findMany.mockResolvedValue(vouchers);
      prismaMock.voucher.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(vouchers);
      expect(result.meta).toBeDefined();
      expect(result.meta.total).toBe(1);
      expect(prismaMock.voucher.findMany).toHaveBeenCalled();
      expect(prismaMock.voucher.count).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a voucher when found', async () => {
      prismaMock.voucher.findUnique.mockResolvedValue(mockVoucher as any);

      const result = await service.findById('v1');

      expect(result).toEqual(mockVoucher);
      expect(prismaMock.voucher.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'v1' },
        }),
      );
    });

    it('should throw NotFoundException when voucher is not found', async () => {
      prismaMock.voucher.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a voucher with usedCount of 0', async () => {
      prismaMock.voucher.findUnique.mockResolvedValue(mockVoucher);
      prismaMock.voucher.delete.mockResolvedValue(mockVoucher);

      const result = await service.delete('v1');

      expect(result).toEqual(mockVoucher);
      expect(prismaMock.voucher.delete).toHaveBeenCalledWith({
        where: { id: 'v1' },
      });
    });

    it('should throw BadRequestException if voucher has been used', async () => {
      const usedVoucher = { ...mockVoucher, usedCount: 5 };

      prismaMock.voucher.findUnique.mockResolvedValue(usedVoucher);

      await expect(service.delete('v1')).rejects.toThrow(BadRequestException);
      expect(prismaMock.voucher.delete).not.toHaveBeenCalled();
    });
  });
});
