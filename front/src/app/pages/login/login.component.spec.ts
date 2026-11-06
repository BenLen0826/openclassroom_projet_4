import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { expect } from '@jest/globals';
import { of, throwError } from 'rxjs';

import { SessionInformation } from '../../core/models/sessionInformation.interface';
import { AuthService } from '../../core/service/auth.service';
import { SessionService } from '../../core/service/session.service';
import { LoginComponent } from './login.component';

// Unitaire : AuthService et SessionService mockés.
describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;

  const sessionInformation: SessionInformation = {
    token: 'fake-jwt-token',
    type: 'Bearer',
    id: 1,
    username: 'yoga@studio.com',
    firstName: 'Admin',
    lastName: 'Admin',
    admin: true,
  };

  const authServiceMock = { login: jest.fn() };
  const sessionServiceMock = { logIn: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: SessionService, useValue: sessionServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    it('should be invalid when empty', () => {
      expect(component.form.valid).toBe(false);
    });

    it('should mark email and password as required', () => {
      expect(component.form.controls.email.hasError('required')).toBe(true);
      expect(component.form.controls.password.hasError('required')).toBe(true);
    });

    it('should reject an email with a wrong format', () => {
      component.form.controls.email.setValue('not-an-email');

      expect(component.form.controls.email.hasError('email')).toBe(true);
    });

    it('should be valid with an email and a password', () => {
      component.form.setValue({ email: 'yoga@studio.com', password: 'test!1234' });

      expect(component.form.valid).toBe(true);
    });
  });

  describe('submit', () => {
    beforeEach(() => {
      component.form.setValue({ email: 'yoga@studio.com', password: 'test!1234' });
    });

    it('should log in, store the session and go to the sessions page on success', () => {
      authServiceMock.login.mockReturnValue(of(sessionInformation));

      component.submit();

      expect(authServiceMock.login).toHaveBeenCalledWith({ email: 'yoga@studio.com', password: 'test!1234' });
      expect(sessionServiceMock.logIn).toHaveBeenCalledWith(sessionInformation);
      expect(router.navigate).toHaveBeenCalledWith(['/sessions']);
      expect(component.onError).toBe(false);
    });

    it('should set onError and stay on the page when the credentials are wrong', () => {
      authServiceMock.login.mockReturnValue(throwError(() => new Error('Bad credentials')));

      component.submit();

      expect(component.onError).toBe(true);
      expect(sessionServiceMock.logIn).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
