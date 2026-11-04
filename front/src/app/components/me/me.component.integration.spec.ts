import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { expect } from '@jest/globals';

import { SessionInformation } from '../../core/models/sessionInformation.interface';
import { User } from '../../core/models/user.interface';
import { SessionService } from '../../core/service/session.service';
import { MeComponent } from './me.component';

// Test d'intégration : vrai composant + vrai template + vrais UserService et SessionService.
// Seul le back est simulé avec HttpTestingController.
describe('MeComponent (integration)', () => {
  let fixture: ComponentFixture<MeComponent>;
  let httpMock: HttpTestingController;
  let sessionService: SessionService;
  let router: Router;

  const sessionInformation: SessionInformation = {
    token: 'fake-jwt-token',
    type: 'Bearer',
    id: 1,
    username: 'toto@test.com',
    firstName: 'Toto',
    lastName: 'Test',
    admin: false,
  };

  const user: User = {
    id: 1,
    email: 'toto@test.com',
    lastName: 'Test',
    firstName: 'Toto',
    admin: false,
    password: 'test!1234',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-02-20'),
  };

  // Texte visible de la page
  const pageText = (): string => fixture.nativeElement.textContent;

  // Crée le composant et répond à la requête GET api/user/1 lancée par ngOnInit
  const createComponentWith = (userFromBack: User): void => {
    fixture = TestBed.createComponent(MeComponent);
    fixture.detectChanges();                           // ngOnInit → GET api/user/1
    httpMock.expectOne('api/user/1').flush(userFromBack); // le "back" répond
    fixture.detectChanges();                           // affiche les données reçues
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);
    sessionService.logIn(sessionInformation); // un utilisateur est connecté
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should display the user information', () => {
    createComponentWith(user);

    expect(pageText()).toContain('Name: Toto TEST'); // le nom de famille passe en majuscules
    expect(pageText()).toContain('Email: toto@test.com');
    expect(pageText()).toContain('January 15, 2026');
    expect(pageText()).toContain('February 20, 2026');
  });

  it('should display "You are admin" and no delete button for an admin', () => {
    createComponentWith({ ...user, admin: true }); // copie de user avec admin à true

    expect(pageText()).toContain('You are admin');
    expect(fixture.nativeElement.querySelector('button[color="warn"]')).toBeNull();
  });

  it('should display the delete button for a non-admin user', () => {
    createComponentWith(user);

    expect(pageText()).not.toContain('You are admin');
    expect(pageText()).toContain('Delete my account');
    expect(fixture.nativeElement.querySelector('button[color="warn"]')).not.toBeNull();
  });

  it('should delete the account and log out when clicking on the delete button', () => {
    createComponentWith(user);
    // On espionne le MatSnackBar réellement utilisé par le composant (fourni par MaterialModule).
    // mockReturnValue évite d'afficher vraiment la snackbar (jsdom ne sait pas lire le CSS Material).
    const snackBarOpen = jest.spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open')
      .mockReturnValue({} as ReturnType<MatSnackBar['open']>);

    fixture.nativeElement.querySelector('button[color="warn"]').click();

    const req = httpMock.expectOne('api/user/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(snackBarOpen).toHaveBeenCalledWith('Your account has been deleted !', 'Close', { duration: 3000 });
    expect(sessionService.isLogged).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
