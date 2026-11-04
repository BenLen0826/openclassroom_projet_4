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
    date: new Date('2026-11-10T10:00:00Z'),
    teacher_id: 2,
    users: [4, 5],
    createdAt: new Date('2026-10-01T10:00:00Z'),
    updatedAt: new Date('2026-10-15T10:00:00Z'),
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

  const pageText = (): string => fixture.nativeElement.textContent;

  // Trouve un bouton d'après son texte (ex : 'Delete', 'Participate')
  const button = (label: string): HTMLButtonElement | undefined =>
    Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent!.trim().endsWith(label));

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

    expect(pageText()).toContain('Yoga Du Matin');            // pipe titlecase
    expect(pageText()).toContain('Margot DELAHAYE');          // professeur, nom en majuscules
    expect(pageText()).toContain('2 attendees');              // users.length
    expect(pageText()).toContain('November 10, 2026');        // date de la session
    expect(pageText()).toContain('Séance douce pour bien commencer la journée');
    expect(pageText()).toContain('October 1, 2026');          // createdAt
    expect(pageText()).toContain('October 15, 2026');         // updatedAt
  });

  it('should display the Delete button, and no participation button, for an admin', () => {
    createComponentAs(true);

    expect(button('Delete')).toBeDefined();
    expect(button('Participate')).toBeUndefined();
    expect(button('Do not participate')).toBeUndefined();
  });

  it('should not display the Delete button for a non-admin user', () => {
    createComponentAs(false);

    expect(button('Delete')).toBeUndefined();
  });

  it('should delete the session and go back to the list when the admin clicks on Delete', () => {
    createComponentAs(true);
    const snackBarOpen = jest.spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open')
      .mockReturnValue({} as ReturnType<MatSnackBar['open']>);

    button('Delete')!.click();

    const req = httpMock.expectOne('api/session/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(snackBarOpen).toHaveBeenCalledWith('Session deleted !', 'Close', { duration: 3000 });
    expect(router.navigate).toHaveBeenCalledWith(['sessions']);
  });

  it('should let a non-admin user participate, then show "Do not participate"', () => {
    createComponentAs(false); // users = [4, 5] : l'utilisateur 3 ne participe pas
    expect(button('Do not participate')).toBeUndefined();

    button('Participate')!.click();

    const req = httpMock.expectOne('api/session/1/participate/3');
    expect(req.request.method).toBe('POST');
    req.flush(null);
    // Le composant recharge la session : le back renvoie maintenant l'utilisateur 3 dans users
    respondWithSession({ ...session, users: [4, 5, 3] });

    expect(button('Do not participate')).toBeDefined();
    expect(pageText()).toContain('3 attendees');
  });

  it('should let a participating user cancel, then show "Participate" again', () => {
    createComponentAs(false, { ...session, users: [3, 4, 5] });

    button('Do not participate')!.click();

    const req = httpMock.expectOne('api/session/1/participate/3');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    respondWithSession(session);

    expect(button('Do not participate')).toBeUndefined();
    expect(button('Participate')).toBeDefined();
    expect(pageText()).toContain('2 attendees');
  });
});
