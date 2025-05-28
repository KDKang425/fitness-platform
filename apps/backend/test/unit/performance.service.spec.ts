import { Test } from '@nestjs/testing';
import { PerformanceService } from '../../src/stats/performance.service';

describe('PerformanceService', () => {
  let svc: PerformanceService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PerformanceService],
    }).compile();
    svc = module.get(PerformanceService);
  });

  it('estimate1RM works', () => {
    expect(svc.estimate1RM(100, 1)).toBe(100);
    expect(svc.estimate1RM(100, 10)).toBe(133);
  });
});