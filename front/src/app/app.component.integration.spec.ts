import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { expect } from '@jest/globals';

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

  // Petite aide : renvoie les textes des liens de la barre de navigation
  const navLinks = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.link') as NodeListOf<HTMLElement>)
      .map(link => link.textContent!.trim());

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
    expect(navLinks()).toEqual(['Login', 'Register']);
  });

  it('should show Sessions, Account and Logout links when the user is logged in', () => {
    sessionService.logIn(sessionInformation);
    fixture.detectChanges(); // on demande à Angular de mettre le HTML à jour

    expect(navLinks()).toEqual(['Sessions', 'Account', 'Logout']);
  });

  it('should log out and go back to Login/Register when clicking on Logout', () => {
    sessionService.logIn(sessionInformation);
    fixture.detectChanges();

    // On cherche le lien "Logout" dans le DOM et on clique dessus, comme un utilisateur
    const logoutLink = Array.from(fixture.nativeElement.querySelectorAll('.link') as NodeListOf<HTMLElement>)
      .find(link => link.textContent!.trim() === 'Logout')!;
    logoutLink.click();
    fixture.detectChanges();

    expect(sessionService.isLogged).toBe(false);
    expect(sessionService.sessionInformation).toBeUndefined();
    expect(router.navigate).toHaveBeenCalledWith(['']);
    expect(navLinks()).toEqual(['Login', 'Register']);
  });
});
