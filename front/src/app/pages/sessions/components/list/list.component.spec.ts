import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { expect } from '@jest/globals';
import { of } from 'rxjs';

import { Session } from '../../../../core/models/session.interface';
import { SessionApiService } from '../../../../core/service/session-api.service';
import { SessionService } from '../../../../core/service/session.service';
import { ListComponent } from './list.component';

// Test unitaire : SessionApiService et SessionService sont mockés.
describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;

  const sessions: Session[] = [
    {
      id: 1,
      name: 'Yoga du matin',
      description: 'Séance douce',
      date: new Date('2026-11-10T10:00:00Z'),
      teacher_id: 2,
      users: [],
    },
  ];

  const sessionServiceMock = { sessionInformation: { admin: true, id: 1 } };
  const sessionApiServiceMock = { all: jest.fn().mockReturnValue(of(sessions)) };

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [ListComponent],
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: sessionServiceMock },
        { provide: SessionApiService, useValue: sessionApiServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the sessions from SessionApiService', () => {
    let result: Session[] | undefined;
    component.sessions$.subscribe(s => result = s);

    expect(sessionApiServiceMock.all).toHaveBeenCalled();
    expect(result).toEqual(sessions);
  });

  it('should expose the logged user information', () => {
    expect(component.user).toEqual({ admin: true, id: 1 });
  });
});
