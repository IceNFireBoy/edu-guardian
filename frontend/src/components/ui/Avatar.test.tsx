import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => {
  const React = require('react');
  const passthrough =
    (tag: string) =>
    ({ children, whileHover, whileTap, ...rest }: any) =>
      React.createElement(tag, rest, children);
  return {
    motion: new Proxy({}, { get: (_t, prop: string) => passthrough(prop) }),
  };
});

import Avatar, { avatarColor, resolveAvatarSrc } from './Avatar';

describe('Avatar', () => {
  it('shows initials on a colored circle when there is no valid image URL', () => {
    render(<Avatar alt="Marxus Magisa" />);
    const initials = screen.getByTestId('avatar-initials');
    expect(initials).toHaveTextContent('MM');
    expect(initials).toHaveStyle({ backgroundColor: avatarColor('Marxus Magisa') });
  });

  it('treats the backend default "no-photo.jpg" as no image', () => {
    expect(resolveAvatarSrc('no-photo.jpg')).toBeUndefined();
    expect(resolveAvatarSrc(undefined)).toBeUndefined();
    expect(resolveAvatarSrc('https://res.cloudinary.com/x/avatar.png')).toBe(
      'https://res.cloudinary.com/x/avatar.png'
    );
    render(<Avatar src="no-photo.jpg" alt="Jane Doe" />);
    expect(screen.getByTestId('avatar-initials')).toHaveTextContent('JD');
  });

  it('is deterministic: the same name always maps to the same color', () => {
    expect(avatarColor('Krizdarl')).toBe(avatarColor('Krizdarl'));
    expect(avatarColor('Krizdarl')).not.toBe(avatarColor('Charlize'));
  });
});
