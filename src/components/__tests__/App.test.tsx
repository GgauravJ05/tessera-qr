import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// qr-code-styling renders to a real canvas, which jsdom does not implement.
// These tests assert on state and wiring, not pixels.
vi.mock('qr-code-styling', () => ({
  default: class QRCodeStylingStub {
    append = vi.fn();
    update = vi.fn();
    download = vi.fn().mockResolvedValue(undefined);
    getRawData = vi.fn().mockResolvedValue(new Blob());
  },
}));

import App from '@/App';

describe('App', () => {
  it('starts on the Link tab with the download disabled', () => {
    render(<App />);
    expect(screen.getByRole('tab', { name: 'Link' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('button', { name: /download/i })).toBeDisabled();
    expect(screen.getByText(/fill in the details/i)).toBeInTheDocument();
  });

  it('enables the download once valid content is entered', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/destination url/i), 'example.com');

    expect(screen.getByRole('button', { name: /download/i })).toBeEnabled();
    expect(screen.queryByText(/fill in the details/i)).not.toBeInTheDocument();
  });

  it('switches forms when a different content type is chosen', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'WiFi' }));

    expect(screen.getByLabelText(/network name/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/destination url/i)).not.toBeInTheDocument();
  });

  it('keeps each tab’s draft when switching away and back', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/destination url/i), 'example.com');
    await user.click(screen.getByRole('tab', { name: 'Text' }));
    await user.click(screen.getByRole('tab', { name: 'Link' }));

    expect(screen.getByLabelText(/destination url/i)).toHaveValue('example.com');
  });

  it('disables the WiFi password field for an open network', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'WiFi' }));
    await user.selectOptions(screen.getByLabelText(/security/i), 'nopass');

    expect(screen.getByLabelText(/password/i)).toBeDisabled();
  });

  it('surfaces a validation error for a malformed email', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Email' }));
    await user.type(screen.getByLabelText(/^to$/i), 'not-an-email');

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download/i })).toBeDisabled();
  });

  it('warns when a chosen colour pair is too faint to scan', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/destination url/i), 'example.com');

    const hexField = screen.getByLabelText(/foreground hex value/i);
    await user.clear(hexField);
    await user.type(hexField, '#EEEEEE');

    expect(await screen.findByText(/likely unscannable/i)).toBeInTheDocument();
  });

  it('reports good contrast for the default palette', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText(/destination url/i), 'example.com');

    expect(screen.getByText(/good contrast/i)).toBeInTheDocument();
  });

  it('applies a preset to the design controls', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Classic' }));

    expect(screen.getByLabelText(/foreground hex value/i)).toHaveValue('#000000');
    expect(screen.getByLabelText(/dot shape/i)).toHaveValue('square');
  });

  it('swaps the background control for a gradient stop when gradients are on', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('switch', { name: /gradient fill/i }));

    expect(screen.getByLabelText(/gradient from hex value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gradient to hex value/i)).toBeInTheDocument();
  });

  it('toggles the theme class on the document root', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(document.documentElement).not.toHaveClass('dark');
    await user.click(screen.getByRole('button', { name: /switch to dark theme/i }));
    expect(document.documentElement).toHaveClass('dark');
  });

  it('shows capacity usage for the current payload', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Text' }));
    await user.type(screen.getByLabelText(/^text$/i), 'hello');

    const meter = screen.getByRole('progressbar', { name: /capacity/i });
    expect(within(meter.parentElement!).getByText(/5 \/ 1663 bytes/)).toBeInTheDocument();
  });
});
