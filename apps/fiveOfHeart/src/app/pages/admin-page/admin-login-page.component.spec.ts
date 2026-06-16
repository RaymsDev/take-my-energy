import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminLoginPageComponent } from './admin-login-page.component';

describe('AdminLoginPageComponent', () => {
  let fixture: ComponentFixture<AdminLoginPageComponent>;
  let component: AdminLoginPageComponent;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const setup = (authenticated = false) => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
      'login',
    ]);
    authSpy.isAuthenticated.and.returnValue(authenticated);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AdminLoginPageComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    fixture = TestBed.createComponent(AdminLoginPageComponent);
    component = fixture.componentInstance;
  };

  it('renders a "Sign in with Google" button', () => {
    setup();
    fixture.detectChanges();
    const btn: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(btn?.textContent?.trim()).toBe('Sign in with Google');
  });

  it('calls authService.login() when button is clicked', () => {
    setup();
    fixture.detectChanges();
    const btn: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    btn.click();
    expect(authSpy.login).toHaveBeenCalled();
  });

  it('redirects to /admin/gift-cards when already authenticated', () => {
    setup(true);
    fixture.detectChanges();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/gift-cards']);
  });

  it('does not redirect when not authenticated', () => {
    setup(false);
    fixture.detectChanges();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
