import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from '@/store/settings';
import { Notated, San } from './San';

describe('San and Notated', () => {
  beforeEach(() => {
    useSettings.getState().reset();
  });

  it('draws the piece from the piece set and keeps the letter inside it, as the move’s text', () => {
    const { container } = render(<San san="Nf3" />);
    const piece = container.querySelector('piece');
    expect(piece).toHaveClass('white', 'knight', 'san__piece');
    // Not hidden: the letter in it is what screen readers read and a button showing it is named by.
    expect(piece).not.toHaveAttribute('aria-hidden');
    expect(piece).toHaveTextContent('N');
    // The whole move is still there as text.
    expect(container.textContent).toBe('Nf3');
    expect(container.querySelector('.san')).toHaveClass('cg-wrap');
  });

  it('shows a promotion piece as a figurine and a pawn move as plain text', () => {
    const { container } = render(<San san="exd8=Q+" />);
    expect(container.querySelector('piece')).toHaveClass('queen');
    expect(container.textContent).toBe('exd8=Q+');
    const plain = render(<San san="e4" className="mono" />);
    expect(plain.container.querySelector('piece')).toBeNull();
    expect(plain.container.querySelector('.mono')).toHaveTextContent('e4');
  });

  it('is plain text when the notation is letters', () => {
    useSettings.getState().update({ notation: 'letters' });
    const { container } = render(<San san="Nf3" />);
    expect(container.querySelector('piece')).toBeNull();
    expect(container.textContent).toBe('Nf3');
  });

  it('notates the moves inside prose and nothing else', () => {
    render(
      <p data-testid="prose">
        <Notated text="Be careful: after Nf3 and Bb5 the e4 pawn hangs." />
      </p>,
    );
    const prose = screen.getByTestId('prose');
    expect(prose.querySelectorAll('piece')).toHaveLength(2);
    expect(prose.querySelector('piece')).toHaveClass('knight');
    expect(prose.textContent).toBe('Be careful: after Nf3 and Bb5 the e4 pawn hangs.');
  });

  it('leaves prose without moves untouched', () => {
    render(
      <p data-testid="prose">
        <Notated text="Nothing to see here." />
      </p>,
    );
    expect(screen.getByTestId('prose').querySelector('piece')).toBeNull();
    expect(screen.getByTestId('prose')).toHaveTextContent('Nothing to see here.');
  });
});
