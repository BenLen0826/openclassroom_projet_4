import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';

import { SessionInformation } from '../core/models/sessionInformation.interface';
import { SessionApiService } from '../core/service/session-api.service';
import { SessionService } from '../core/service/session.service';
import { customJwtInterceptorFn } from './customJwtInterceptorFn';

// Test d'intégration : vrai SessionApiService + vrai HttpClient + vrai intercepteur
// + vrai SessionService. Seul le back est simulé par HttpTestingController.
describe('customJwtInterceptorFn (integration)', () => {
  let sessionApiService: SessionApiService;
  let sessionService: SessionService;
  let httpMock: HttpTestingController;

  const sessionInformation: SessionInformation = {
    token: 'fake-jwt-token',
    type: 'Bearer',
    id: 1,
    username: 'yoga@studio.com',
    firstName: 'Admin',
    lastName: 'Admin',
    admin: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // Comme dans app.config.ts : HttpClient AVEC l'intercepteur
        provideHttpClient(withInterceptors([customJwtInterceptorFn])),
        provideHttpClientTesting(),
      ],
    });
    sessionApiService = TestBed.inject(SessionApiService);
    sessionService = TestBed.inject(SessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add the Bearer token to requests when the user is logged in', () => {
    sessionService.logIn(sessionInformation);

    sessionApiService.all().subscribe();

    const req = httpMock.expectOne('api/session');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-jwt-token');
    req.flush([]);
  });

  it('should not add any Authorization header when the user is not logged in', () => {
    sessionApiService.all().subscribe();

    const req = httpMock.expectOne('api/session');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('should stop sending the token after logout', () => {
    sessionService.logIn(sessionInformation);
    sessionService.logOut();

    sessionApiService.all().subscribe();

    const req = httpMock.expectOne('api/session');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });
});
