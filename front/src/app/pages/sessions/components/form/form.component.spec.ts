import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { expect } from '@jest/globals';
import { of } from 'rxjs';

import { Session } from '../../../../core/models/session.interface';
import { SessionApiService } from '../../../../core/service/session-api.service';
import { SessionService } from '../../../../core/service/session.service';
import { TeacherService } from '../../../../core/service/teacher.service';
import { FormComponent } from './form.component';

// Unitaire : services et ActivatedRoute mockés ; router.url est simulé pour choisir entre création et modification.
describe('FormComponent', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;
  let router: Router;

  const session: Session = {
    id: 1,
    name: 'Yoga du matin',
    description: 'Séance douce',
    date: new Date('2026-11-10T12:00:00Z'),
    teacher_id: 2,
    users: [],
  };

  const sessionServiceMock = { sessionInformation: { admin: true, id: 1 } };
  const sessionApiServiceMock = {
    detail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const teacherServiceMock = { all: jest.fn() };
  const matSnackBarMock = { open: jest.fn() };

  const createComponent = async (url: string, admin = true): Promise<void> => {
    sessionServiceMock.sessionInformation = { admin, id: 1 };

    await TestBed.configureTestingModule({
      imports: [FormComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
        { provide: SessionService, useValue: sessionServiceMock },
        { provide: SessionApiService, useValue: sessionApiServiceMock },
        { provide: TeacherService, useValue: teacherServiceMock },
      ],
    })
      .overrideProvider(MatSnackBar, { useValue: matSnackBarMock })
      .compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    // router.url est un getter : on espionne sa lecture ('get') pour simuler l'URL courante
    jest.spyOn(router, 'url', 'get').mockReturnValue(url);

    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionApiServiceMock.detail.mockReturnValue(of(session));
    sessionApiServiceMock.create.mockReturnValue(of(session));
    sessionApiServiceMock.update.mockReturnValue(of(session));
    teacherServiceMock.all.mockReturnValue(of([]));
  });

  it('should redirect a non-admin user to the sessions list', async () => {
    await createComponent('/sessions/create', false);

    expect(router.navigate).toHaveBeenCalledWith(['/sessions']);
  });

  it('should not redirect an admin user', async () => {
    await createComponent('/sessions/create');

    expect(router.navigate).not.toHaveBeenCalled();
  });

  describe('create mode', () => {
    beforeEach(async () => await createComponent('/sessions/create'));

    it('should not be in update mode and should not load any session', () => {
      expect(component.onUpdate).toBe(false);
      expect(sessionApiServiceMock.detail).not.toHaveBeenCalled();
    });

    it('should init an empty form', () => {
      expect(component.sessionForm!.getRawValue()).toEqual({
        name: '',
        date: '',
        teacher_id: null,
        description: '',
      });
    });

    it('should mark every field as required', () => {
      const { name, date, teacher_id, description } = component.sessionForm!.controls;

      expect(name.hasError('required')).toBe(true);
      expect(date.hasError('required')).toBe(true);
      expect(teacher_id.hasError('required')).toBe(true);
      expect(description.hasError('required')).toBe(true);
      expect(component.sessionForm!.valid).toBe(false);
    });

    it('submit() should create the session, show a message and go back to the list', () => {
      component.sessionForm!.setValue({
        name: 'Yoga du soir',
        date: '2026-11-12',
        teacher_id: 3,
        description: 'Séance relaxante',
      });

      component.submit();

      expect(sessionApiServiceMock.create).toHaveBeenCalledWith({
        name: 'Yoga du soir',
        date: new Date('2026-11-12'), // la chaîne du champ date est convertie en Date
        teacher_id: 3,
        description: 'Séance relaxante',
      });
      expect(sessionApiServiceMock.update).not.toHaveBeenCalled();
      expect(matSnackBarMock.open).toHaveBeenCalledWith('Session created !', 'Close', { duration: 3000 });
      expect(router.navigate).toHaveBeenCalledWith(['sessions']);
    });
  });

  describe('update mode', () => {
    beforeEach(async () => await createComponent('/sessions/update/1'));

    it('should be in update mode and load the session from the url id', () => {
      expect(component.onUpdate).toBe(true);
      expect(sessionApiServiceMock.detail).toHaveBeenCalledWith('1');
    });

    it('should fill the form with the session', () => {
      expect(component.sessionForm!.getRawValue()).toEqual({
        name: 'Yoga du matin',
        date: '2026-11-10', // Date convertie au format attendu par <input type="date">
        teacher_id: 2,
        description: 'Séance douce',
      });
    });

    it('submit() should update the session, show a message and go back to the list', () => {
      component.sessionForm!.controls.name.setValue('Yoga du matin (modifié)');

      component.submit();

      expect(sessionApiServiceMock.update).toHaveBeenCalledWith('1', {
        name: 'Yoga du matin (modifié)',
        date: new Date('2026-11-10'),
        teacher_id: 2,
        description: 'Séance douce',
      });
      expect(sessionApiServiceMock.create).not.toHaveBeenCalled();
      expect(matSnackBarMock.open).toHaveBeenCalledWith('Session updated !', 'Close', { duration: 3000 });
      expect(router.navigate).toHaveBeenCalledWith(['sessions']);
    });
  });
});
