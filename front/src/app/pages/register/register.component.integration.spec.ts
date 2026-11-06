import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { expect } from '@jest/globals';

import { getByTestId } from '../../../testing/test-id';
import { RegisterComponent } from './register.component';

// Intégration : composant, template et AuthService réels ; seul le back est simulé.
describe('RegisterComponent (integration)', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  // data-testid de chaque champ du formulaire
  type Field = 'firstName' | 'lastName' | 'email' | 'password';
  const fieldTestIds: Record<Field, string> = {
    firstName: 'register-first-name-field',
    lastName: 'register-last-name-field',
    email: 'register-email-field',
    password: 'register-password-field',
  };

  const input = (name: Field): HTMLInputElement => getByTestId<HTMLInputElement>(fixture, fieldTestIds[name]);

  const type = (name: Field, value: string): void => {
    input(name).value = value;
    input(name).dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const leave = (name: Field): void => {
    input(name).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };

  const submitButton = (): HTMLButtonElement => getByTestId<HTMLButtonElement>(fixture, 'register-submit-action');

  const fillForm = (): void => {
    type('firstName', 'Toto');
    type('lastName', 'Test');
    type('email', 'toto@test.com');
    type('password', 'test!1234');
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the account and go to the login page', () => {
    fillForm();

    submitButton().click();

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'toto@test.com',
      firstName: 'Toto',
      lastName: 'Test',
      password: 'test!1234',
    });
    req.flush(null);

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should display an error when the back refuses the registration', () => {
    fillForm();

    submitButton().click();

    httpMock.expectOne('/api/auth/register')
      .flush('Email already taken', { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(getByTestId(fixture, 'register-error-message').textContent).toContain('An error occurred');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it.each<Field>(['firstName', 'lastName', 'email', 'password'])(
    'should disable the submit button when %s is missing',
    (missingField: Field) => {
      fillForm();
      type(missingField, ''); // on vide un seul champ

      expect(submitButton().disabled).toBe(true);
    }
  );

  it('should highlight a required field in error when it is left empty', () => {
    // Champ retrouvé par son data-testid, puis son cadre Material, dont on vérifie l'affichage d'erreur
    const firstNameField = (): HTMLElement => input('firstName').closest('mat-form-field')!;

    leave('firstName');

    expect(firstNameField().classList).toContain('mat-form-field-invalid');
  });

  it('should not send any request when clicking submit with an empty form', () => {
    submitButton().click();

    httpMock.expectNone('/api/auth/register');
  });
});
