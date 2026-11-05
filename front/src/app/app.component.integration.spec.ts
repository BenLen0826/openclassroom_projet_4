import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { expect } from '@jest/globals';

import { getByTestId } from '../testing/test-id';
import { AppComponent } from './app.component';
import { SessionInformation } from './core/models/sessionInformation.interface';
import { SessionService } from './core/service/session.service';

// Test d'intégration : vrai composant + vrai template + vrai SessionService.
// On vérifie ce que l'utilisateur VOIT dans la barre de navigation, et le parcours Logout.
describe('AppComponent (integration)', () => {
  let fixture: ComponentFixture<AppComponent>;
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

  // Petite aide : renvoie les data-testid des liens affichés dans la barre de navigation, dans l'ordre de la page
  // ([data-testid^="nav-"] = tous les data-testid qui COMMENCENT par "nav-").
  // On compare les data-testid et non les textes : renommer un lien ne doit pas casser ces tests.
  const navLinks = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('[data-testid^="nav-"]') as NodeListOf<HTMLElement>)
      .map(link => link.dataset['testid']!);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    sessionService = TestBed.inject(SessionService); // le VRAI service
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges(); // premier affichage du template
  });

  it('should show Login and Register links when the user is not logged in', () => {
    expect(navLinks()).toEqual(['nav-login-action', 'nav-register-action']);
  });

  it('should show Sessions, Account and Logout links when the user is logged in', () => {
    sessionService.logIn(sessionInformation);
    fixture.detectChanges(); // on demande à Angular de mettre le HTML à jour

    expect(navLinks()).toEqual(['nav-sessions-action', 'nav-account-action', 'nav-logout-action']);
  });

  it('should log out and go back to Login/Register when clicking on Logout', () => {
    sessionService.logIn(sessionInformation);
    fixture.detectChanges();

    // On cherche le lien "Logout" dans le DOM et on clique dessus, comme un utilisateur
    getByTestId(fixture, 'nav-logout-action').click();
    fixture.detectChanges();

    expect(sessionService.isLogged).toBe(false);
    expect(sessionService.sessionInformation).toBeUndefined();
    expect(router.navigate).toHaveBeenCalledWith(['']);
    expect(navLinks()).toEqual(['nav-login-action', 'nav-register-action']);
  });
});
