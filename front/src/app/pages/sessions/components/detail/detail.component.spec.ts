import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { expect } from '@jest/globals';
import { of } from 'rxjs';

import { Session } from '../../../../core/models/session.interface';
import { Teacher } from '../../../../core/models/teacher.interface';
import { SessionApiService } from '../../../../core/service/session-api.service';
import { SessionService } from '../../../../core/service/session.service';
import { TeacherService } from '../../../../core/service/teacher.service';
import { DetailComponent } from './detail.component';

// Unitaire : services et ActivatedRoute (paramètre :id) mockés.
describe('DetailComponent', () => {
  let component: DetailComponent;
  let fixture: ComponentFixture<DetailComponent>;
  let router: Router;

  const session: Session = {
    id: 1,
    name: 'Yoga du matin',
    description: 'Séance douce',
    date: new Date('2026-11-10T12:00:00Z'),
    teacher_id: 2,
    users: [3, 4],
  };
  const teacher: Teacher = {
    id: 2,
    lastName: 'DELAHAYE',
    firstName: 'Margot',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  // Faux ActivatedRoute : "l'URL actuelle contient id = 1"
  const activatedRouteMock = { snapshot: { paramMap: convertToParamMap({ id: '1' }) } };
  const sessionServiceMock = { sessionInformation: { admin: false, id: 3 } };
  const sessionApiServiceMock = {
    detail: jest.fn(),
    delete: jest.fn(),
    participate: jest.fn(),
    unParticipate: jest.fn(),
  };
  const teacherServiceMock = { detail: jest.fn() };
  const matSnackBarMock = { open: jest.fn() };

  // Crée le composant en tant qu'utilisateur admin ou non
  const createComponent = async (admin: boolean): Promise<void> => {
    sessionServiceMock.sessionInformation = { admin, id: 3 };

    await TestBed.configureTestingModule({
      imports: [DetailComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: SessionService, useValue: sessionServiceMock },
        { provide: SessionApiService, useValue: sessionApiServiceMock },
        { provide: TeacherService, useValue: teacherServiceMock },
      ],
    })
      .overrideProvider(MatSnackBar, { useValue: matSnackBarMock })
      .compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(DetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit → fetchSession()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionApiServiceMock.detail.mockReturnValue(of(session));
    sessionApiServiceMock.delete.mockReturnValue(of(undefined));
    sessionApiServiceMock.participate.mockReturnValue(of(undefined));
    sessionApiServiceMock.unParticipate.mockReturnValue(of(undefined));
    teacherServiceMock.detail.mockReturnValue(of(teacher));
  });

  describe('on init', () => {
    beforeEach(async () => await createComponent(false));

    it('should read the session id from the url and the user from the session', () => {
      expect(component.sessionId).toBe('1');
      expect(component.userId).toBe('3');
      expect(component.isAdmin).toBe(false);
    });

    it('should load the session, then its teacher', () => {
      expect(sessionApiServiceMock.detail).toHaveBeenCalledWith('1');
      // le teacher_id (2) de la session sert à charger le professeur
      expect(teacherServiceMock.detail).toHaveBeenCalledWith('2');
      expect(component.session).toEqual(session);
      expect(component.teacher).toEqual(teacher);
    });

    it('should know the user participates when his id is in session.users', () => {
      expect(component.isParticipate).toBe(true); // users = [3, 4] et userId = 3
    });
  });

  it('should know the user does not participate when his id is not in session.users', async () => {
    sessionApiServiceMock.detail.mockReturnValue(of({ ...session, users: [4] }));
    await createComponent(false);

    expect(component.isParticipate).toBe(false);
  });

  it('should set isAdmin for an admin user', async () => {
    await createComponent(true);

    expect(component.isAdmin).toBe(true);
  });

  describe('actions', () => {
    beforeEach(async () => await createComponent(false));

    describe('back()', () => {
      let historyBack: jest.SpyInstance;

      // window.history est global : on restaure back() après le test pour ne pas impacter les tests suivants.
      afterEach(() => historyBack.mockRestore());

      it('should go to the previous page', () => {
        historyBack = jest.spyOn(window.history, 'back').mockImplementation(() => {});

        component.back();

        expect(historyBack).toHaveBeenCalled();
      });
    });

    it('delete() should delete the session, show a message and go back to the list', () => {
      component.delete();

      expect(sessionApiServiceMock.delete).toHaveBeenCalledWith('1');
      expect(matSnackBarMock.open).toHaveBeenCalledWith('Session deleted !', 'Close', { duration: 3000 });
      expect(router.navigate).toHaveBeenCalledWith(['sessions']);
    });

    it('participate() should register the user, then reload the session', () => {
      component.participate();

      expect(sessionApiServiceMock.participate).toHaveBeenCalledWith('1', '3');
      expect(sessionApiServiceMock.detail).toHaveBeenCalledTimes(2); // init + rechargement
    });

    it('unParticipate() should unregister the user, then reload the session', () => {
      component.unParticipate();

      expect(sessionApiServiceMock.unParticipate).toHaveBeenCalledWith('1', '3');
      expect(sessionApiServiceMock.detail).toHaveBeenCalledTimes(2);
    });
  });
});
