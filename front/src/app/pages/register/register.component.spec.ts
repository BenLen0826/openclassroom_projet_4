import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { expect } from '@jest/globals';
import { of, throwError } from 'rxjs';

import { RegisterRequest } from '../../core/models/registerRequest.interface';
import { AuthService } from '../../core/service/auth.service';
import { RegisterComponent } from './register.component';

// Test unitaire : AuthService est mocké, on teste la validation et le submit du composant.
describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let router: Router;

  const registerRequest: RegisterRequest = {
    email: 'toto@test.com',
    firstName: 'Toto',
    lastName: 'Test',
    password: 'test!1234',
  };

  const authServiceMock = { register: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(RegisterComponent);
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

    it('should mark every field as required', () => {
      const { email, firstName, lastName, password } = component.form.controls;

      expect(email.hasError('required')).toBe(true);
      expect(firstName.hasError('required')).toBe(true);
      expect(lastName.hasError('required')).toBe(true);
      expect(password.hasError('required')).toBe(true);
    });

    it('should reject an email with a wrong format', () => {
      component.form.controls.email.setValue('not-an-email');

      expect(component.form.controls.email.hasError('email')).toBe(true);
    });

    it('should be invalid as soon as one field is missing', () => {
      component.form.setValue({ ...registerRequest, lastName: '' });

      expect(component.form.valid).toBe(false);
    });

    it('should be valid when every field is filled', () => {
      component.form.setValue(registerRequest);

      expect(component.form.valid).toBe(true);
    });
  });

  describe('submit', () => {
    beforeEach(() => {
      component.form.setValue(registerRequest);
    });

    it('should register and go to the login page on success', () => {
      authServiceMock.register.mockReturnValue(of(undefined));

      component.submit();

      expect(authServiceMock.register).toHaveBeenCalledWith(registerRequest);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(component.onError).toBe(false);
    });

    it('should set onError and stay on the page when the registration fails', () => {
      authServiceMock.register.mockReturnValue(throwError(() => new Error('Email already taken')));

      component.submit();

      expect(component.onError).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
