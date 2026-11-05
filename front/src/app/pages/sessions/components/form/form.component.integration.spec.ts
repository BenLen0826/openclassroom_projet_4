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
import { getByTestId, queryAllByTestId } from '../../../../../testing/test-id';
import { FormComponent } from './form.component';

// Test d'intégration : vrai composant + vrai template + vrais SessionApiService, TeacherService
// et SessionService. On remplit le formulaire dans le DOM ; seuls le back et l'URL sont simulés.
describe('FormComponent (integration)', () => {
  let fixture: ComponentFixture<FormComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let snackBarOpen: jest.SpyInstance;

  const teachers: Teacher[] = [
    { id: 2, lastName: 'DELAHAYE', firstName: 'Margot', createdAt: new Date(), updatedAt: new Date() },
    { id: 3, lastName: 'THIERCELIN', firstName: 'Hélène', createdAt: new Date(), updatedAt: new Date() },
  ];

  const session: Session = {
    id: 1,
    name: 'Yoga du matin',
    description: 'Séance douce',
    date: new Date('2026-11-10T10:00:00Z'),
    teacher_id: 2,
    users: [],
  };

  const admin: SessionInformation = {
    token: 'fake-jwt-token',
    type: 'Bearer',
    id: 1,
    username: 'yoga@studio.com',
    firstName: 'Admin',
    lastName: 'Admin',
    admin: true,
  };

  // --- Aides pour manipuler le DOM ---
  // Champ texte du formulaire, retrouvé par son data-testid "form-<name>-field" (ex : form-name-field)
  type TextField = 'name' | 'date' | 'description';
  const field = (name: TextField): HTMLInputElement | HTMLTextAreaElement =>
    getByTestId<HTMLInputElement | HTMLTextAreaElement>(fixture, `form-${name}-field`);

  const type = (name: TextField, value: string): void => {
    field(name).value = value;
    field(name).dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const leave = (name: TextField): void => {
    field(name).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };

  // Ouvre la liste déroulante Material puis clique sur l'option du professeur
  // (avant : clic sur .mat-mdc-select-trigger, une classe INTERNE de Material ; le data-testid suffit)
  const selectTeacher = (teacherName: string): void => {
    getByTestId(fixture, 'form-teacher-field').click();
    fixture.detectChanges();
    // Les options s'affichent dans un calque ajouté à la fin du <body>, hors du composant : on cherche dans "document".
    // L'option est filtrée par le nom du professeur (une donnée, pas un libellé du template).
    const option = queryAllByTestId(document, 'form-teacher-option')
      .find(o => o.textContent!.trim() === teacherName)!;
    option.click();
    fixture.detectChanges();
  };

  const saveButton = (): HTMLButtonElement => getByTestId<HTMLButtonElement>(fixture, 'form-save-action');

  const title = (): string => getByTestId(fixture, 'form-title-text').textContent!.trim();

  // Crée le composant pour une URL donnée (création ou modification)
  const createComponentAt = (url: string): void => {
    jest.spyOn(router, 'url', 'get').mockReturnValue(url);
    fixture = TestBed.createComponent(FormComponent);
    fixture.detectChanges(); // ngOnInit
    snackBarOpen = jest.spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open')
      .mockReturnValue({} as ReturnType<MatSnackBar['open']>);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(SessionService).logIn(admin);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('create a session', () => {
    beforeEach(() => {
      createComponentAt('/sessions/create');
      // Le formulaire s'affiche tout de suite → la liste des professeurs est chargée
      httpMock.expectOne('api/teacher').flush(teachers);
      fixture.detectChanges();
    });

    it('should display the creation title and an empty form', () => {
      expect(title()).toBe('Create session');
      expect(field('name').value).toBe('');
      expect(field('description').value).toBe('');
    });

    it('should create the session and go back to the list', () => {
      type('name', 'Yoga du soir');
      type('date', '2026-11-12');
      selectTeacher('Hélène THIERCELIN');
      type('description', 'Séance relaxante');

      saveButton().click();

      const req = httpMock.expectOne('api/session');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        name: 'Yoga du soir',
        date: new Date('2026-11-12'),
        teacher_id: 3,
        description: 'Séance relaxante',
      });
      req.flush({ ...req.request.body, id: 2, users: [] });

      expect(snackBarOpen).toHaveBeenCalledWith('Session created !', 'Close', { duration: 3000 });
      expect(router.navigate).toHaveBeenCalledWith(['sessions']);
    });

    it.each(['name', 'date', 'teacher_id', 'description'])(
      'should disable the Save button when %s is missing',
      (missingField: string) => {
        if (missingField !== 'name') type('name', 'Yoga du soir');
        if (missingField !== 'date') type('date', '2026-11-12');
        if (missingField !== 'teacher_id') selectTeacher('Hélène THIERCELIN');
        if (missingField !== 'description') type('description', 'Séance relaxante');

        expect(saveButton().disabled).toBe(true);
      }
    );

    it('should enable the Save button when every field is filled', () => {
      type('name', 'Yoga du soir');
      type('date', '2026-11-12');
      selectTeacher('Hélène THIERCELIN');
      type('description', 'Séance relaxante');

      expect(saveButton().disabled).toBe(false);
    });

    it('should highlight a required field in error when it is left empty', () => {
      // Champ retrouvé par son data-testid, puis son cadre Material, dont on vérifie l'affichage d'erreur
      const nameField = (): HTMLElement => field('name').closest('mat-form-field')!;

      leave('name');

      expect(nameField().classList).toContain('mat-form-field-invalid');
    });
  });

  describe('update a session', () => {
    beforeEach(() => {
      createComponentAt('/sessions/update/1');
      // Mode modification : on charge d'abord la session...
      httpMock.expectOne('api/session/1').flush(session);
      fixture.detectChanges();
      // ...le formulaire apparaît alors, et charge à son tour les professeurs
      httpMock.expectOne('api/teacher').flush(teachers);
      fixture.detectChanges();
    });

    it('should display the update title and a form filled with the session', async () => {
      // mat-select affiche l'option choisie de façon asynchrone (Promise) :
      // whenStable() attend la fin de ces tâches, puis on réaffiche.
      await fixture.whenStable();
      fixture.detectChanges();

      expect(title()).toBe('Update session');
      expect(field('name').value).toBe('Yoga du matin');
      expect(field('date').value).toBe('2026-11-10');
      expect(field('description').value).toBe('Séance douce');
      expect(getByTestId(fixture, 'form-teacher-field').textContent).toContain('Margot DELAHAYE');
    });

    it('should update the session and go back to the list', () => {
      type('name', 'Yoga du matin (modifié)');

      saveButton().click();

      const req = httpMock.expectOne('api/session/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        name: 'Yoga du matin (modifié)',
        date: new Date('2026-11-10'),
        teacher_id: 2,
        description: 'Séance douce',
      });
      req.flush({ ...session, name: 'Yoga du matin (modifié)' });

      expect(snackBarOpen).toHaveBeenCalledWith('Session updated !', 'Close', { duration: 3000 });
      expect(router.navigate).toHaveBeenCalledWith(['sessions']);
    });

    it('should disable the Save button when a required field is emptied', () => {
      type('description', '');

      expect(saveButton().disabled).toBe(true);
    });
  });
});
