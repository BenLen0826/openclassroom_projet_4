import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';

import { Teacher } from '../models/teacher.interface';
import { TeacherService } from './teacher.service';

describe('TeacherService', () => {
  let service: TeacherService;
  let httpMock: HttpTestingController;

  const teacher: Teacher = {
    id: 2,
    lastName: 'DELAHAYE',
    firstName: 'Margot',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TeacherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('all() should GET the list of teachers', () => {
    let result: Teacher[] | undefined;
    service.all().subscribe(teachers => result = teachers);

    const req = httpMock.expectOne('api/teacher');
    expect(req.request.method).toBe('GET');
    req.flush([teacher]);

    expect(result).toEqual([teacher]);
  });

  it('detail() should GET one teacher by id', () => {
    let result: Teacher | undefined;
    service.detail('2').subscribe(t => result = t);

    const req = httpMock.expectOne('api/teacher/2');
    expect(req.request.method).toBe('GET');
    req.flush(teacher);

    expect(result).toEqual(teacher);
  });
});
