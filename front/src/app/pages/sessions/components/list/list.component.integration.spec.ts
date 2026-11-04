import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { expect } from '@jest/globals';

import { Session } from '../../../../core/models/session.interface';
import { SessionInformation } from '../../../../core/models/sessionInformation.interface';
import { SessionService } from '../../../../core/service/session.service';
import { ListComponent } from './list.component';

// Test d'intégration : vrai composant + vrai template + vrais SessionApiService et SessionService.
describe('ListComponent (integration)', () => {
  let fixture: ComponentFixture<ListComponent>;
  let httpMock: HttpTestingController;
  let sessionService: SessionService;

  const sessions: Session[] = [
    {
      id: 1,
      name: 'Yoga du matin',
      description: 'Séance douce pour bien commencer la journée',
      date: new Date('2026-11-10T10:00:00Z'),
      teacher_id: 2,
      users: [],
    },
    {
      id: 2,
      name: 'Yoga du soir',
      description: 'Séance relaxante',
      date: new Date('2026-11-12T10:00:00Z'),
      teacher_id: 3,
      users: [5],
    },
  ];

  const loggedUser = (admin: boolean): SessionInformation => ({
    token: 'fake-jwt-token',
    type: 'Bearer',
    id: 1,
    username: 'yoga@studio.com',
    firstName: 'Yoga',
    lastName: 'User',
    admin,
  });

  // Textes des boutons de la page (ex : ['Create', 'Detail', 'Edit', ...])
  const buttonLabels = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLElement>)
      .map(button => button.querySelector('.ml1')!.textContent!.trim());

  // Connecte l'utilisateur, affiche la page et répond à GET api/session
  const createComponentAs = (admin: boolean): void => {
    sessionService.logIn(loggedUser(admin));
    fixture = TestBed.createComponent(ListComponent);
    fixture.detectChanges();
    httpMock.expectOne('api/session').flush(sessions);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should display the list of sessions', () => {
    createComponentAs(false);

    const cards = fixture.nativeElement.querySelectorAll('mat-card.item');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Yoga du matin');
    expect(cards[0].textContent).toContain('Session on November 10, 2026');
    expect(cards[0].textContent).toContain('Séance douce pour bien commencer la journée');
    expect(cards[1].textContent).toContain('Yoga du soir');
  });

  it('should display the Create button and an Edit button per session for an admin', () => {
    createComponentAs(true);

    expect(buttonLabels()).toEqual(['Create', 'Detail', 'Edit', 'Detail', 'Edit']);
  });

  it('should only display the Detail buttons for a non-admin user', () => {
    createComponentAs(false);

    expect(buttonLabels()).toEqual(['Detail', 'Detail']);
  });

  it('should display no session card when there is no session', () => {
    sessionService.logIn(loggedUser(false));
    fixture = TestBed.createComponent(ListComponent);
    fixture.detectChanges();
    httpMock.expectOne('api/session').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('mat-card.item').length).toBe(0);
  });
});
