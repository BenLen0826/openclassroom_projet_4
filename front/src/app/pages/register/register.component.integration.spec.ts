import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { expect } from '@jest/globals';

import { RegisterComponent } from './register.component';

// Test d'intégration : vrai composant + vrai template + vrai AuthService.
// On remplit le formulaire dans le DOM ; seul le back est simulé.
describe('RegisterComponent (integration)', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  const input = (name: string): HTMLInputElement =>
    fixture.nativeElement.querySelector(`input[formControlName="${name}"]`);

  const type = (name: string, value: string): void => {
    input(name).value = value;
    input(name).dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const leave = (name: string): void => {
    input(name).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };

  const submitButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button[type="submit"]');

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

    expect(fixture.nativeElement.querySelector('.error').textContent).toContain('An error occurred');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  // it.each : le même test lancé une fois par champ obligatoire
  it.each(['firstName', 'lastName', 'email', 'password'])(
    'should disable the submit button when %s is missing',
    (missingField: string) => {
      fillForm();
      type(missingField, ''); // on vide un seul champ

      expect(submitButton().disabled).toBe(true);
    }
  );

  it('should highlight a required field in error when it is left empty', () => {
    const firstNameField = (): HTMLElement => fixture.nativeElement.querySelectorAll('mat-form-field')[0];

    leave('firstName');

    expect(firstNameField().classList).toContain('mat-form-field-invalid');
  });

  it('should not send any request when clicking submit with an empty form', () => {
    submitButton().click();

    httpMock.expectNone('/api/auth/register');
  });
});
