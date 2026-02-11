import { useAuthStore } from './authStore';

vi.mock('@/lib/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should set accessToken and user on success', async () => {
      const { apiClient } = await import('@/lib/api');
      (apiClient.post as any).mockResolvedValue({ accessToken: 'test-token' });
      (apiClient.get as any).mockResolvedValue({
        id: 'u1',
        email: 'test@enzara.vn',
        fullName: 'Test',
        role: 'CUSTOMER',
        avatar: null,
        emailVerified: true,
      });

      await useAuthStore.getState().login('test@enzara.vn', 'pass123');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('test-token');
      expect(state.user?.email).toBe('test@enzara.vn');
      expect(state.isLoading).toBe(false);
    });

    it('should clear state on login failure', async () => {
      const { apiClient } = await import('@/lib/api');
      (apiClient.post as any).mockRejectedValue(new Error('Invalid'));

      await expect(
        useAuthStore.getState().login('bad@enzara.vn', 'wrong'),
      ).rejects.toThrow();

      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should set accessToken and user on success', async () => {
      const { apiClient } = await import('@/lib/api');
      (apiClient.post as any).mockResolvedValue({ accessToken: 'new-token' });
      (apiClient.get as any).mockResolvedValue({
        id: 'u2',
        email: 'new@enzara.vn',
        fullName: 'New User',
        role: 'CUSTOMER',
        avatar: null,
        emailVerified: false,
      });

      await useAuthStore.getState().register('new@enzara.vn', 'pass123', 'New User');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-token');
      expect(state.user?.fullName).toBe('New User');
    });
  });

  describe('logout', () => {
    it('should clear user and token', async () => {
      useAuthStore.setState({
        user: { id: 'u1', email: 'a@b.com', fullName: 'A', role: 'CUSTOMER', avatar: null, emailVerified: true },
        accessToken: 'token',
      });
      const { apiClient } = await import('@/lib/api');
      (apiClient.post as any).mockResolvedValue(undefined);

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().accessToken).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should update user directly', () => {
      const user = { id: 'u1', email: 'a@b.com', fullName: 'A', role: 'CUSTOMER' as const, avatar: null, emailVerified: true };
      useAuthStore.getState().setUser(user);
      expect(useAuthStore.getState().user).toEqual(user);
    });

    it('should clear user when set to null', () => {
      useAuthStore.setState({
        user: { id: 'u1', email: 'a@b.com', fullName: 'A', role: 'CUSTOMER', avatar: null, emailVerified: true },
      });
      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
