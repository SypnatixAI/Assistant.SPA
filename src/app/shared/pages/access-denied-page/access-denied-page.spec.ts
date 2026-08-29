import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthenticationService } from '../../../core/services/authentication/authentication.service';
import { AccessDeniedPage } from './access-denied-page';

describe('AccessDeniedPage', () => {
  let fixture: ComponentFixture<AccessDeniedPage>;
  let logout: jasmine.Spy;

  beforeEach(async () => {
    logout = jasmine.createSpy('logout');
    await TestBed.configureTestingModule({
      imports: [AccessDeniedPage],
      providers: [
        {
          provide: AuthenticationService,
          useValue: { logout },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AccessDeniedPage);
    fixture.detectChanges();
  });

  it('Given_ForbiddenUser_When_logoutIsCalled_Then_AuthenticationSessionIsClosed', () => {
    // Given
    const page = fixture.componentInstance;

    // When
    page.logout();

    // Then
    expect(logout).toHaveBeenCalled();
  });
});
