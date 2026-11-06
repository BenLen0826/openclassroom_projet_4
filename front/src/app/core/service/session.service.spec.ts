import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';

import { SessionInformation } from '../models/sessionInformation.interface';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;

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
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not be logged in by default', () => {
    expect(service.isLogged).toBe(false);
    expect(service.sessionInformation).toBeUndefined();
  });

  it('should store the user and be logged in after logIn', () => {
    service.logIn(sessionInformation);

    expect(service.isLogged).toBe(true);
    expect(service.sessionInformation).toEqual(sessionInformation);
  });

  it('should clear the user and be logged out after logOut', () => {
    service.logIn(sessionInformation);

    service.logOut();

    expect(service.isLogged).toBe(false);
    expect(service.sessionInformation).toBeUndefined();
  });

  it('should emit the login state through $isLogged', () => {
    const values: boolean[] = [];
    service.$isLogged().subscribe(isLogged => values.push(isLogged));

    service.logIn(sessionInformation);
    service.logOut();

    // BehaviorSubject émet d'abord sa valeur actuelle (false), puis chaque changement
    expect(values).toEqual([false, true, false]);
  });
});
