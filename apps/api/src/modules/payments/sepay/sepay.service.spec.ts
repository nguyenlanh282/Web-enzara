import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SepayService } from './sepay.service';

const mockConfigService = {
  get: vi.fn((key: string, defaultValue?: string) => {
    const config: Record<string, string> = {
      'SEPAY_BANK_NAME': 'MBBank',
      'SEPAY_ACCOUNT_NUMBER': '123456789',
      'SEPAY_ACCOUNT_HOLDER': 'ENZARA COMPANY',
      'SEPAY_PREFIX': 'PC',
      'SEPAY_API_KEY': 'test-api-key-123',
    };
    return config[key] ?? defaultValue ?? '';
  }),
};

describe('SepayService', () => {
  let service: SepayService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SepayService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SepayService>(SepayService);
  });

  describe('generateQRUrl', () => {
    it('should return a URL containing the order amount and description', () => {
      const order = { orderNumber: 'ENZ-20250101-0001', total: 500000 };

      const url = service.generateQRUrl(order);

      expect(url).toBeTypeOf('string');
      expect(url).toContain('500000');
      expect(url).toContain('ENZ-20250101-0001');
    });
  });

  describe('getPaymentInfo', () => {
    it('should return payment info with correct properties', () => {
      const order = { orderNumber: 'ENZ-20250101-0001', total: 250000 };

      const info = service.getPaymentInfo(order);

      expect(info).toHaveProperty('bankName');
      expect(info).toHaveProperty('accountNumber');
      expect(info).toHaveProperty('accountHolder');
      expect(info).toHaveProperty('amount');
      expect(info).toHaveProperty('content');
      expect(info).toHaveProperty('qrUrl');
      expect(info.accountNumber).toBe('123456789');
      expect(info.accountHolder).toBe('ENZARA COMPANY');
      expect(info.amount).toBe(250000);
      expect(info.content).toContain('ENZ-20250101-0001');
      expect(info.qrUrl).toBeTypeOf('string');
    });
  });

  describe('extractOrderNumber', () => {
    it('should extract "ENZ-20250101-0001" from a content string containing it', () => {
      const content = 'Payment for order ENZ-20250101-0001 completed';

      const result = service.extractOrderNumber(content);

      expect(result).toBe('ENZ-20250101-0001');
    });

    it('should return null when no order number pattern is found', () => {
      const content = 'Random payment content with no order reference';

      const result = service.extractOrderNumber(content);

      expect(result).toBeNull();
    });

    it('should handle content with multiple patterns and return the first match', () => {
      const content = 'Orders ENZ-20250101-0001 and ENZ-20250202-0002 received';

      const result = service.extractOrderNumber(content);

      expect(result).toBe('ENZ-20250101-0001');
    });
  });

  describe('verifyWebhook', () => {
    it('should return true when auth header matches "Apikey {configured-key}"', () => {
      const result = service.verifyWebhook('Apikey test-api-key-123');

      expect(result).toBe(true);
    });

    it('should return false when auth header does not match', () => {
      const result = service.verifyWebhook('Apikey wrong-key');

      expect(result).toBe(false);
    });

    it('should return false when auth header is empty or undefined', () => {
      expect(service.verifyWebhook('')).toBe(false);
      expect(service.verifyWebhook(undefined)).toBe(false);
    });
  });
});
