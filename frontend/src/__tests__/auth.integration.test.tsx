import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';
import { MemoryRouter } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const mockUser = {
  _id: '1',
  username: 'newuser',
  email: 'new@example.com',
  name: 'New User',
  profileImage: 'https://example.com/avatar.jpg',
  xp: 0,
  level: 1,
  streak: {
    current: 0,
    longest: 0,
    lastUpdated: new Date().toISOString()
  },
  achievements: [],
  recentActivity: []
};

const server = setupServer(
  rest.post('/api/v1/auth/register', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({
      success: true,
      data: {
        user: mockUser,
        token: 'testtoken'
      }
    }));
  }),
  rest.post('/api/v1/auth/login', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({
      success: true,
      data: {
        user: mockUser,
        token: 'testtoken'
      }
    }));
  }),
  rest.get('/api/v1/users/profile', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({
      success: true,
      data: mockUser
    }));
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
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New User' } });
    
    fireEvent.click(screen.getByText('Register'));
    
    await waitFor(() => {
      expect(screen.getByText('Welcome, New User')).toBeInTheDocument();
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
      expect(screen.getByText('Welcome, New User')).toBeInTheDocument();
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
      rest.get('/api/v1/users/profile', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({
          success: false,
          error: 'Unauthorized',
          message: 'Please log in to access this resource'
        }));
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