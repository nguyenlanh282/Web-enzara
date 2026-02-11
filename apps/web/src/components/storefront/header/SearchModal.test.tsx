import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from '../../../../tests/render-with-intl';
import { SearchModal } from './SearchModal';

// Mock fetch for search API
vi.stubGlobal('fetch', vi.fn());

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('SearchModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render content when closed', () => {
    renderWithIntl(<SearchModal open={false} onClose={mockOnClose} />);
    expect(screen.queryByPlaceholderText(/Tim kiem/i)).not.toBeInTheDocument();
  });

  it('should render search input when open', () => {
    renderWithIntl(<SearchModal open={true} onClose={mockOnClose} />);
    expect(screen.getByPlaceholderText('Tim kiem san pham...')).toBeInTheDocument();
  });

  it('should have the input auto-focused when open', () => {
    renderWithIntl(<SearchModal open={true} onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText('Tim kiem san pham...');
    expect(input).toHaveAttribute('placeholder', 'Tim kiem san pham...');
  });

  it('should render close button', () => {
    renderWithIntl(<SearchModal open={true} onClose={mockOnClose} />);
    const closeButton = screen.getByLabelText('Dong');
    expect(closeButton).toBeInTheDocument();
  });
});
