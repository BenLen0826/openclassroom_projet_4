import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { expect } from '@jest/globals';

import { SessionInformation } from '../../core/models/sessionInformation.interface';
import { SessionService } from '../../core/service/session.service';
import { getByTestId, queryByTestId } from '../../../testing/test-id';
import { LoginComponent } from './login.component';

// Intégration : composant, template, AuthService et SessionService réels ; seul le back est simulé.
describe('LoginComponent (integration)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let httpMock: HttpTestingController;
  let sessionService: SessionService;
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

  // Champ du formulaire, retrouvé par son data-testid "login-<name>-field" (ex : login-email-field)
  const input = (name: 'email' | 'password'): HTMLInputElement =>
    getByTestId<HTMLInputElement>(fixture, `login-${name}-field`);

  const type = (name: 'email' | 'password', value: string): void => {
    input(name).value = value;
    input(name).dispatchEvent(new Event('input')); // prévient Angular qu'on a tapé
    fixture.detectChanges();
  };

  // Simule le fait de quitter un champ (le champ devient "touched")
  const leave = (name: 'email' | 'password'): void => {
    input(name).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };

  const submitButton = (): HTMLButtonElement => getByTestId<HTMLButtonElement>(fixture, 'login-submit-action');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should log in and go to the sessions page with valid credentials', () => {
    type('email', 'yoga@studio.com');
    type('password', 'test!1234');

    submitButton().click();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'yoga@studio.com', password: 'test!1234' });
    req.flush(sessionInformation);

    expect(sessionService.isLogged).toBe(true);
    expect(sessionService.sessionInformation).toEqual(sessionInformation);
    expect(router.navigate).toHaveBeenCalledWith(['/sessions']);
  });

  it('should display an error and stay logged out with a wrong login/password', () => {
    type('email', 'yoga@studio.com');
    type('password', 'wrong-password');

    submitButton().click();

    // Le back refuse : réponse HTTP 401
    httpMock.expectOne('/api/auth/login')
      .flush('Bad credentials', { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(getByTestId(fixture, 'login-error-message').textContent).toContain('An error occurred');
    expect(sessionService.isLogged).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should not display the error message before any submit', () => {
    expect(queryByTestId(fixture, 'login-error-message')).toBeNull();
  });

  it('should disable the submit button while a required field is missing', () => {
    expect(submitButton().disabled).toBe(true); // tout est vide

    type('email', 'yoga@studio.com');
    expect(submitButton().disabled).toBe(true); // il manque le mot de passe

    type('password', 'test!1234');
    expect(submitButton().disabled).toBe(false); // tout est rempli
  });

  it('should highlight a required field in error when it is left empty', () => {
    // On vérifie l'état d'erreur affiché par Material, porté par le mat-form-field parent du champ.
    const emailField = (): HTMLElement => input('email').closest('mat-form-field')!;
    expect(emailField().classList).not.toContain('mat-form-field-invalid'); // pas encore touché

    leave('email'); // l'utilisateur clique dans le champ puis en sort sans rien taper

    expect(emailField().classList).toContain('mat-form-field-invalid');
  });

  it('should not send any request when clicking submit with an empty form', () => {
    submitButton().click();

    // Le bouton est désactivé : aucune requête ne doit partir (vérifié par httpMock.verify)
    httpMock.expectNone('/api/auth/login');
  });
});
