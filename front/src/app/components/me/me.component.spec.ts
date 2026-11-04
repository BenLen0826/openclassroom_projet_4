import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { expect } from '@jest/globals';
import { of } from 'rxjs';

import { User } from '../../core/models/user.interface';
import { SessionService } from '../../core/service/session.service';
import { UserService } from '../../core/service/user.service';
import { MeComponent } from './me.component';

// Test unitaire : tous les services sont mockés, on teste la logique de MeComponent
describe('MeComponent', () => {
  let component: MeComponent;
  let fixture: ComponentFixture<MeComponent>;
  let router: Router;

  const user: User = {
    id: 1,
    email: 'yoga@studio.com',
    lastName: 'Admin',
    firstName: 'Admin',
    admin: true,
    password: 'test!1234',
    createdAt: new Date('2026-01-01'),
  };

  const sessionServiceMock = {
    sessionInformation: { admin: true, id: 1 },
    logOut: jest.fn(),
  };
  const userServiceMock = {
    getById: jest.fn().mockReturnValue(of(user)),       // "le back répond avec user"
    delete: jest.fn().mockReturnValue(of(undefined)),   // "le back répond OK, sans contenu"
  };
  const matSnackBarMock = { open: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [MeComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: SessionService, useValue: sessionServiceMock },
        { provide: UserService, useValue: userServiceMock },
      ],
    })
      // MaterialModule (importé par le composant) fournit son propre MatSnackBar :
      // overrideProvider le remplace partout, y compris dans les modules importés.
      .overrideProvider(MatSnackBar, { useValue: matSnackBarMock })
      .compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(MeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // déclenche ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the logged user on init', () => {
    // L'id de l'utilisateur connecté est converti en string pour le service
    expect(userServiceMock.getById).toHaveBeenCalledWith('1');
    expect(component.user).toEqual(user);
  });

  it('back() should go to the previous page', () => {
    // mockImplementation : on remplace le vrai comportement (sinon jsdom changerait de page)
    const historyBack = jest.spyOn(window.history, 'back').mockImplementation(() => {});

    component.back();

    expect(historyBack).toHaveBeenCalled();
  });

  it('delete() should delete the account, show a message, log out and redirect', () => {
    component.delete();

    expect(userServiceMock.delete).toHaveBeenCalledWith('1');
    expect(matSnackBarMock.open).toHaveBeenCalledWith(
      'Your account has been deleted !', 'Close', { duration: 3000 }
    );
    expect(sessionServiceMock.logOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
