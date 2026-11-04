import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { expect } from '@jest/globals';

import { SessionService } from '../core/service/session.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  // Mocks : de faux objets qui ont juste ce dont le guard a besoin
  const sessionServiceMock = { isLogged: false };
  const routerMock = { navigate: jest.fn() }; // fonction espion : enregistre ses appels

  beforeEach(() => {
    // Remet les compteurs de jest.fn() à zéro entre deux tests
    jest.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        // "quand quelqu'un demande SessionService, donne-lui mon mock"
        { provide: SessionService, useValue: sessionServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
    guard = TestBed.inject(AuthGuard);
  });

  it('should allow access when the user is logged in', () => {
    sessionServiceMock.isLogged = true;

    expect(guard.canActivate()).toBe(true);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should block access and redirect to login when the user is not logged in', () => {
    sessionServiceMock.isLogged = false;

    expect(guard.canActivate()).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['login']);
  });
});
