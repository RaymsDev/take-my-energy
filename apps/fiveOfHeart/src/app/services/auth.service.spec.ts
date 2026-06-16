import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

const TOKEN_KEY = 'admin_token';

const makeRouter = () => jasmine.createSpyObj<Router>('Router', ['navigate']);

describe('AuthService', () => {
  afterEach(() => {
    sessionStorage.clear();
    history.pushState(null, '', '/');
  });

  const create = (platformId = 'browser') => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: Router, useValue: makeRouter() },
      ],
    });
    return TestBed.inject(AuthService);
  };

  describe('constructor — hash extraction (browser)', () => {
    it('stores token from hash fragment in sessionStorage', () => {
      history.pushState(null, '', '/#access_token=mytoken');
      create();
      expect(sessionStorage.getItem(TOKEN_KEY)).toBe('mytoken');
    });

    it('strips the fragment via history.replaceState', () => {
      history.pushState(null, '', '/#access_token=mytoken');
      spyOn(history, 'replaceState').and.callThrough();
      create();
      expect(history.replaceState).toHaveBeenCalled();
      expect(window.location.hash).toBe('');
    });

    it('does nothing when no hash present', () => {
      history.pushState(null, '', '/');
      create();
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    });
  });

  describe('getToken / isAuthenticated', () => {
    it('returns the stored token', () => {
      const svc = create();
      sessionStorage.setItem(TOKEN_KEY, 'tok');
      expect(svc.getToken()).toBe('tok');
      expect(svc.isAuthenticated()).toBe(true);
    });

    it('returns null / false when no token', () => {
      const svc = create();
      expect(svc.getToken()).toBeNull();
      expect(svc.isAuthenticated()).toBe(false);
    });
  });

  describe('logout', () => {
    it('removes token and navigates to /admin/login', () => {
      const svc = create();
      const router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
      sessionStorage.setItem(TOKEN_KEY, 'tok');
      svc.logout();
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
    });
  });

  describe('SSR (server platform)', () => {
    it('constructs without throwing', () => {
      expect(() => create('server')).not.toThrow();
    });

    it('getToken() returns null', () => {
      expect(create('server').getToken()).toBeNull();
    });

    it('isAuthenticated() returns false', () => {
      expect(create('server').isAuthenticated()).toBe(false);
    });
  });
});
