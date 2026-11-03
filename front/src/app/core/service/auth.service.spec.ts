import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';

import { LoginRequest } from '../models/loginRequest.interface';
import { RegisterRequest } from '../models/registerRequest.interface';
import { SessionInformation } from '../models/sessionInformation.interface';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('register() should POST the register request', () => {
    const registerRequest: RegisterRequest = {
      email: 'toto@test.com',
      firstName: 'Toto',
      lastName: 'Test',
      password: 'test!1234',
    };
    let completed = false;

    service.register(registerRequest).subscribe(() => completed = true);

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(registerRequest);
    req.flush(null);

    expect(completed).toBe(true);
  });

  it('login() should POST the credentials and return the session information', () => {
    const loginRequest: LoginRequest = { email: 'yoga@studio.com', password: 'test!1234' };
    const sessionInformation: SessionInformation = {
      token: 'fake-jwt-token',
      type: 'Bearer',
      id: 1,
      username: 'yoga@studio.com',
      firstName: 'Admin',
      lastName: 'Admin',
      admin: true,
    };
    let result: SessionInformation | undefined;

    service.login(loginRequest).subscribe(info => result = info);

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(loginRequest);
    req.flush(sessionInformation);

    expect(result).toEqual(sessionInformation);
  });
});
