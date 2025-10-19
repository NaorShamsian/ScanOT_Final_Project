import { Test, TestingModule } from '@nestjs/testing';
import { Pbkdf2Service } from './pbkdf2.service';

describe('Pbkdf2Service', () => {
  let service: Pbkdf2Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Pbkdf2Service],
    }).compile();

    service = module.get<Pbkdf2Service>(Pbkdf2Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
