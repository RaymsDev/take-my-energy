import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const runGuard = () =>
    TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

  const setup = (authenticated: boolean) => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
    ]);
    authServiceSpy.isAuthenticated.and.returnValue(authenticated);

    routerSpy = jasmine.createSpyObj<Router>('Router', [
      'navigate',
      'createUrlTree',
    ]);
    routerSpy.createUrlTree.and.callFake(
      (commands: unknown[]) => ({ commands }) as unknown as UrlTree,
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  };

  it('returns true when authenticated', () => {
    setup(true);
    expect(runGuard()).toBe(true);
  });

  it('returns UrlTree pointing to /admin/login when not authenticated', () => {
    setup(false);
    const result = runGuard();
    expect(result).not.toBe(true as unknown as UrlTree);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/admin/login']);
  });
});
