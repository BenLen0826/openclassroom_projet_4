import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { expect } from '@jest/globals';
import { of } from 'rxjs';

import { AppComponent } from './app.component';
import { SessionService } from './core/service/session.service';

// Unitaire : SessionService mocké.
describe('AppComponent', () => {
  let component: AppComponent;
  let router: Router;

  const sessionServiceMock = {
    $isLogged: jest.fn().mockReturnValue(of(false)),
    logOut: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: sessionServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component = TestBed.createComponent(AppComponent).componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('$isLogged() should return the login state of SessionService', () => {
    let value: boolean | undefined;
    component.$isLogged().subscribe(isLogged => value = isLogged);

    expect(sessionServiceMock.$isLogged).toHaveBeenCalled();
    expect(value).toBe(false);
  });

  it('logout() should log out and redirect to the home page', () => {
    component.logout();

    expect(sessionServiceMock.logOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['']);
  });
});
