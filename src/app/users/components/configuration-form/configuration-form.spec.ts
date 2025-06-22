import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationForm } from './configuration-form';

describe('ConfigurationForm', () => {
  let component: ConfigurationForm;
  let fixture: ComponentFixture<ConfigurationForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfigurationForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigurationForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
