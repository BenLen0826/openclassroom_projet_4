import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';

import { Session } from '../models/session.interface';
import { SessionApiService } from './session-api.service';

describe('SessionApiService', () => {
  let service: SessionApiService;
  let httpMock: HttpTestingController;

  const session: Session = {
    id: 1,
    name: 'Yoga du matin',
    description: 'Séance douce pour bien commencer la journée',
    date: new Date('2026-11-10'),
    teacher_id: 2,
    users: [3, 4],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(SessionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Échoue s'il reste une requête non vérifiée ou sans réponse
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('all() should GET the list of sessions', () => {
    let result: Session[] | undefined;

    service.all().subscribe(sessions => result = sessions);

    const req = httpMock.expectOne('api/session');
    expect(req.request.method).toBe('GET');

    req.flush([session]);

    expect(result).toEqual([session]);
  });

  it('detail() should GET one session by id', () => {
    let result: Session | undefined;
    service.detail('1').subscribe(s => result = s);

    const req = httpMock.expectOne('api/session/1');
    expect(req.request.method).toBe('GET');
    req.flush(session);

    expect(result).toEqual(session);
  });

  it('delete() should DELETE the session', () => {
    let completed = false;
    service.delete('1').subscribe(() => completed = true);

    const req = httpMock.expectOne('api/session/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });

  it('create() should POST the session in the body', () => {
    let result: Session | undefined;
    service.create(session).subscribe(s => result = s);

    const req = httpMock.expectOne('api/session');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(session);
    req.flush(session);

    expect(result).toEqual(session);
  });

  it('update() should PUT the session in the body', () => {
    let result: Session | undefined;
    service.update('1', session).subscribe(s => result = s);

    const req = httpMock.expectOne('api/session/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(session);
    req.flush(session);

    expect(result).toEqual(session);
  });

  it('participate() should POST to the participate url', () => {
    let completed = false;
    service.participate('1', '3').subscribe(() => completed = true);

    const req = httpMock.expectOne('api/session/1/participate/3');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush(null);

    expect(completed).toBe(true);
  });

  it('unParticipate() should DELETE the participation', () => {
    let completed = false;
    service.unParticipate('1', '3').subscribe(() => completed = true);

    const req = httpMock.expectOne('api/session/1/participate/3');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });
});
