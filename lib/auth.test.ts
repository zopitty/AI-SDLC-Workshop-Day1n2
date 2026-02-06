import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createSession, getSession, clearSession } from './auth';
import jwt from 'jsonwebtoken';

// Mock Next.js cookies
const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

describe('auth', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  
  beforeEach(() => {
    mockCookieStore.set.mockClear();
    mockCookieStore.get.mockClear();
    mockCookieStore.delete.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session token and set cookie', async () => {
      const userId = 1;
      const username = 'testuser';
      
      await createSession(userId, username);
      
      expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
      
      const [cookieName, token, options] = mockCookieStore.set.mock.calls[0];
      expect(cookieName).toBe('todo-session');
      expect(typeof token).toBe('string');
      expect(options).toMatchObject({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
    });

    it('should create a valid JWT token with userId and username', async () => {
      const userId = 123;
      const username = 'johndoe';
      
      await createSession(userId, username);
      
      const token = mockCookieStore.set.mock.calls[0][1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      expect(decoded.userId).toBe(userId);
      expect(decoded.username).toBe(username);
    });

    it('should set token expiration to 7 days', async () => {
      await createSession(1, 'testuser');
      
      const token = mockCookieStore.set.mock.calls[0][1];
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBe(7 * 24 * 60 * 60); // 7 days in seconds
    });

    it('should set secure flag in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      await createSession(1, 'testuser');
      
      const options = mockCookieStore.set.mock.calls[0][2];
      expect(options.secure).toBe(true);
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not set secure flag in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      await createSession(1, 'testuser');
      
      const options = mockCookieStore.set.mock.calls[0][2];
      expect(options.secure).toBe(false);
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle different userIds', async () => {
      await createSession(999, 'user999');
      
      const token = mockCookieStore.set.mock.calls[0][1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      expect(decoded.userId).toBe(999);
    });

    it('should handle special characters in username', async () => {
      const username = 'user@example.com';
      await createSession(1, username);
      
      const token = mockCookieStore.set.mock.calls[0][1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      expect(decoded.username).toBe(username);
    });
  });

  describe('getSession', () => {
    it('should return session from valid token', async () => {
      const userId = 42;
      const username = 'validuser';
      const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
      
      mockCookieStore.get.mockReturnValue({ value: token });
      
      const session = await getSession();
      
      expect(session).toMatchObject({ userId, username });
      expect(mockCookieStore.get).toHaveBeenCalledWith('todo-session');
    });

    it('should return null when no cookie exists', async () => {
      mockCookieStore.get.mockReturnValue(undefined);
      
      const session = await getSession();
      
      expect(session).toBeNull();
    });

    it('should return null when cookie has no value', async () => {
      mockCookieStore.get.mockReturnValue({});
      
      const session = await getSession();
      
      expect(session).toBeNull();
    });

    it('should return null for expired token', async () => {
      const token = jwt.sign({ userId: 1, username: 'test' }, JWT_SECRET, { expiresIn: '-1s' });
      
      mockCookieStore.get.mockReturnValue({ value: token });
      
      const session = await getSession();
      
      expect(session).toBeNull();
    });

    it('should return null for invalid token', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'invalid-token' });
      
      const session = await getSession();
      
      expect(session).toBeNull();
    });

    it('should return null for token with wrong secret', async () => {
      const token = jwt.sign({ userId: 1, username: 'test' }, 'wrong-secret', { expiresIn: '7d' });
      
      mockCookieStore.get.mockReturnValue({ value: token });
      
      const session = await getSession();
      
      expect(session).toBeNull();
    });

    it('should return null for malformed token', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformed' });
      
      const session = await getSession();
      
      expect(session).toBeNull();
    });

    it('should handle tokens without userId', async () => {
      const token = jwt.sign({ username: 'test' }, JWT_SECRET, { expiresIn: '7d' });
      
      mockCookieStore.get.mockReturnValue({ value: token });
      
      const session = await getSession();
      
      expect(session).toMatchObject({ username: 'test' });
    });

    it('should handle tokens without username', async () => {
      const token = jwt.sign({ userId: 1 }, JWT_SECRET, { expiresIn: '7d' });
      
      mockCookieStore.get.mockReturnValue({ value: token });
      
      const session = await getSession();
      
      expect(session).toMatchObject({ userId: 1 });
    });

    it('should preserve all token data', async () => {
      const userId = 100;
      const username = 'testuser';
      const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
      
      mockCookieStore.get.mockReturnValue({ value: token });
      
      const session = await getSession();
      
      expect(session).toHaveProperty('userId', userId);
      expect(session).toHaveProperty('username', username);
    });
  });

  describe('clearSession', () => {
    it('should delete the session cookie', async () => {
      await clearSession();
      
      expect(mockCookieStore.delete).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.delete).toHaveBeenCalledWith('todo-session');
    });

    it('should be callable multiple times', async () => {
      await clearSession();
      await clearSession();
      
      expect(mockCookieStore.delete).toHaveBeenCalledTimes(2);
    });

    it('should complete successfully even if cookie does not exist', async () => {
      mockCookieStore.delete.mockImplementation(() => {
        // Simulate cookie not existing
      });
      
      await expect(clearSession()).resolves.toBeUndefined();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full session lifecycle', async () => {
      // Create session
      const userId = 1;
      const username = 'testuser';
      await createSession(userId, username);
      
      const token = mockCookieStore.set.mock.calls[0][1];
      
      // Get session
      mockCookieStore.get.mockReturnValue({ value: token });
      const session = await getSession();
      
      expect(session).toMatchObject({ userId, username });
      
      // Clear session
      await clearSession();
      
      expect(mockCookieStore.delete).toHaveBeenCalledWith('todo-session');
    });

    it('should handle session with different user IDs', async () => {
      for (let i = 1; i <= 5; i++) {
        await createSession(i, `user${i}`);
        
        const token = mockCookieStore.set.mock.calls[mockCookieStore.set.mock.calls.length - 1][1];
        mockCookieStore.get.mockReturnValue({ value: token });
        
        const session = await getSession();
        expect(session?.userId).toBe(i);
        expect(session?.username).toBe(`user${i}`);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle userId of 0', async () => {
      await createSession(0, 'user0');
      
      const token = mockCookieStore.set.mock.calls[0][1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      expect(decoded.userId).toBe(0);
    });

    it('should handle negative userId', async () => {
      await createSession(-1, 'userNegative');
      
      const token = mockCookieStore.set.mock.calls[0][1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      expect(decoded.userId).toBe(-1);
    });

    it('should handle very long username', async () => {
      const longUsername = 'a'.repeat(1000);
      await createSession(1, longUsername);
      
      const token = mockCookieStore.set.mock.calls[0][1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      expect(decoded.username).toBe(longUsername);
    });

    it('should handle empty username', async () => {
      await createSession(1, '');
      
      const token = mockCookieStore.set.mock.calls[0][1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      expect(decoded.username).toBe('');
    });

    it('should handle username with unicode characters', async () => {
      const username = '用户名🎉';
      await createSession(1, username);
      
      const token = mockCookieStore.set.mock.calls[0][1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      expect(decoded.username).toBe(username);
    });
  });
});
