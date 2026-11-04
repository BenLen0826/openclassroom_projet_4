import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { expect } from '@jest/globals';

import { SessionService } from '../core/service/session.service';
import { UnauthGuard } from './unauth.guard';

describe('UnauthGuard', () => {
  let guard: UnauthGuard;

  const sessionServiceMock = { isLogged: false };
  const routerMock = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        { provide: SessionService, useValue: sessionServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
    guard = TestBed.inject(UnauthGuard);
  });

  it('should allow access to login/register when the user is not logged in', () => {
    sessionServiceMock.isLogged = false;

    expect(guard.canActivate()).toBe(true);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should block access and redirect when the user is already logged in', () => {
    sessionServiceMock.isLogged = true;

    expect(guard.canActivate()).toBe(false);
    // Le guard redirige actuellement vers 'rentals', une route qui n'existe pas (voir review-todo 2.1)
    expect(routerMock.navigate).toHaveBeenCalledWith(['rentals']);
  });
});
