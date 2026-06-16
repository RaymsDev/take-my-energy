import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authInterceptorFn } from './auth.interceptor';

describe('authInterceptorFn', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const setup = (token: string | null) => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'getToken',
      'logout',
    ]);
    authServiceSpy.getToken.and.returnValue(token);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptorFn])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: { navigate: jasmine.createSpy() } },
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  };

  afterEach(() => controller.verify());

  it('attaches Authorization header for /api/* when token exists', () => {
    setup('mytoken');
    http.get('/api/gift-cards').subscribe();
    const req = controller.expectOne('/api/gift-cards');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mytoken');
    req.flush([]);
  });

  it('does not attach Authorization header when no token', () => {
    setup(null);
    http.get('/api/gift-cards').subscribe();
    const req = controller.expectOne('/api/gift-cards');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('passes through external URLs without adding header', () => {
    setup('mytoken');
    http.get('https://fonts.googleapis.com/css').subscribe();
    const req = controller.expectOne('https://fonts.googleapis.com/css');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush('');
  });

  it('calls logout() on 401 response and rethrows error', (done) => {
    setup('mytoken');
    http.get('/api/gift-cards').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
        expect(authServiceSpy.logout).toHaveBeenCalled();
        done();
      },
    });
    const req = controller.expectOne('/api/gift-cards');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('does not call logout() on 500 response', (done) => {
    setup('mytoken');
    http.get('/api/gift-cards').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(500);
        expect(authServiceSpy.logout).not.toHaveBeenCalled();
        done();
      },
    });
    const req = controller.expectOne('/api/gift-cards');
    req.flush('Server Error', { status: 500, statusText: 'Server Error' });
  });
});
