import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';
import { MemoryRouter } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ user: { id: '1', username: 'newuser', email: 'new@example.com' }, token: 'testtoken' }));
  }),
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ user: { id: '1', username: 'newuser', email: 'new@example.com' }, token: 'testtoken' }));
  }),
  rest.get('/api/auth/profile', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: '1', username: 'newuser', email: 'new@example.com' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Authentication Integration', () => {
  it('registers a new user and logs in', async () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Register'));
    await waitFor(() => {
      expect(screen.getByText('Welcome, newuser')).toBeInTheDocument();
    });
  });

  it('logs in an existing user', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByText('Welcome, newuser')).toBeInTheDocument();
    });
  });

  it('logs out and redirects to login', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('Logout'));
    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });

  it('prevents access to protected routes when not authenticated', async () => {
    server.use(
      rest.get('/api/auth/profile', (req, res, ctx) => {
        return res(ctx.status(401));
      })
    );
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });
}); 