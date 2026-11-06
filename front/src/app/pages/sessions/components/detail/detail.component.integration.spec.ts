import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { expect } from '@jest/globals';

import { Session } from '../../../../core/models/session.interface';
import { SessionInformation } from '../../../../core/models/sessionInformation.interface';
import { Teacher } from '../../../../core/models/teacher.interface';
import { SessionService } from '../../../../core/service/session.service';
import { getByTestId, queryByTestId } from '../../../../../testing/test-id';
import { DetailComponent } from './detail.component';

// Test d'intégration : vrai composant + vrai template + vrais SessionApiService, TeacherService
// et SessionService. Seuls le back (HttpTestingController) et l'URL (ActivatedRoute) sont simulés.
describe('DetailComponent (integration)', () => {
  let fixture: ComponentFixture<DetailComponent>;
  let httpMock: HttpTestingController;
  let sessionService: SessionService;
  let router: Router;

  const session: Session = {
    id: 1,
    name: 'yoga du matin',
    description: 'Séance douce pour bien commencer la journée',
    date: new Date('2026-11-10T12:00:00Z'),
    teacher_id: 2,
    users: [4, 5],
    createdAt: new Date('2026-10-01T12:00:00Z'),
    updatedAt: new Date('2026-10-15T12:00:00Z'),
  };
  const teacher: Teacher = {
    id: 2,
    lastName: 'Delahaye',
    firstName: 'Margot',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const loggedUser = (admin: boolean): SessionInformation => ({
    token: 'fake-jwt-token',
    type: 'Bearer',
    id: 3,
    username: 'yoga@studio.com',
    firstName: 'Yoga',
    lastName: 'User',
    admin,
  });

  // Texte affiché dans l'élément qui porte ce data-testid
  const textOf = (testId: string): string => getByTestId(fixture, testId).textContent!.trim();

  // Bouton d'action retrouvé par son data-testid (ex : 'detail-delete-action'), ou null s'il n'est pas affiché
  const button = (testId: string): HTMLButtonElement | null => queryByTestId<HTMLButtonElement>(fixture, testId);

  // Le "back" répond aux deux requêtes enchaînées : la session, PUIS son professeur
  const respondWithSession = (sessionFromBack: Session): void => {
    httpMock.expectOne('api/session/1').flush(sessionFromBack);
    httpMock.expectOne('api/teacher/2').flush(teacher); // n'existe qu'après le premier flush
    fixture.detectChanges();
  };

  const createComponentAs = (admin: boolean, sessionFromBack: Session = session): void => {
    sessionService.logIn(loggedUser(admin));
    fixture = TestBed.createComponent(DetailComponent);
    fixture.detectChanges(); // ngOnInit → GET api/session/1
    respondWithSession(sessionFromBack);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        // L'URL simulée : /sessions/detail/1
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should display the session information', () => {
    createComponentAs(false);

    expect(textOf('detail-name-text')).toBe('Yoga Du Matin');                 // pipe titlecase
    expect(textOf('detail-teacher-text')).toBe('Margot DELAHAYE');            // professeur, nom en majuscules
    expect(textOf('detail-attendees-text')).toBe('2 attendees');              // users.length
    expect(textOf('detail-date-text')).toBe('November 10, 2026');             // date de la session
    expect(textOf('detail-description-text')).toContain('Séance douce pour bien commencer la journée');
    expect(textOf('detail-created-at-text')).toContain('October 1, 2026');    // createdAt
    expect(textOf('detail-updated-at-text')).toContain('October 15, 2026');   // updatedAt
  });

  it('should display the Delete button, and no participation button, for an admin', () => {
    createComponentAs(true);

    expect(button('detail-delete-action')).not.toBeNull();
    expect(button('detail-participate-action')).toBeNull();
    expect(button('detail-unparticipate-action')).toBeNull();
  });

  it('should not display the Delete button for a non-admin user', () => {
    createComponentAs(false);

    expect(button('detail-delete-action')).toBeNull();
  });

  it('should delete the session and go back to the list when the admin clicks on Delete', () => {
    createComponentAs(true);
    const snackBarOpen = jest.spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open')
      .mockReturnValue({} as ReturnType<MatSnackBar['open']>);

    getByTestId(fixture, 'detail-delete-action').click();

    const req = httpMock.expectOne('api/session/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(snackBarOpen).toHaveBeenCalledWith('Session deleted !', 'Close', { duration: 3000 });
    expect(router.navigate).toHaveBeenCalledWith(['sessions']);
  });

  it('should let a non-admin user participate, then show "Do not participate"', () => {
    createComponentAs(false); // users = [4, 5] : l'utilisateur 3 ne participe pas
    expect(button('detail-unparticipate-action')).toBeNull();

    getByTestId(fixture, 'detail-participate-action').click();

    const req = httpMock.expectOne('api/session/1/participate/3');
    expect(req.request.method).toBe('POST');
    req.flush(null);
    // Le composant recharge la session : le back renvoie maintenant l'utilisateur 3 dans users
    respondWithSession({ ...session, users: [4, 5, 3] });

    expect(button('detail-unparticipate-action')).not.toBeNull();
    expect(button('detail-participate-action')).toBeNull();
    expect(textOf('detail-attendees-text')).toBe('3 attendees');
  });

  it('should let a participating user cancel, then show "Participate" again', () => {
    createComponentAs(false, { ...session, users: [3, 4, 5] });

    getByTestId(fixture, 'detail-unparticipate-action').click();

    const req = httpMock.expectOne('api/session/1/participate/3');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    respondWithSession(session);

    expect(button('detail-unparticipate-action')).toBeNull();
    expect(button('detail-participate-action')).not.toBeNull();
    expect(textOf('detail-attendees-text')).toBe('2 attendees');
  });
});
