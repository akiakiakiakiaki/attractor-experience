import { describe, expect, it } from 'vitest';
import { sampleSizePreference, sampleVeilProfile, selectParticleSizeBand } from '@/experience/stages/attractor/ParticleDistribution';

describe('particle veil distribution', () => {
  it('generates a repeatable, irregular multi-scale profile', () => {
    const profile = sampleVeilProfile(0.37);

    expect(sampleVeilProfile(0.37)).toEqual(profile);
    expect(sampleVeilProfile(-1)).toEqual(sampleVeilProfile(0));
    expect(sampleVeilProfile(2)).toEqual(sampleVeilProfile(1));
    expect(profile.mainSpread).toBeGreaterThan(0);
    expect(profile.secondSpread).toBeGreaterThan(0);
  });

  it('concentrates the main veil more heavily on the left side', () => {
    expect(sampleVeilProfile(0.1).mainShare).toBeGreaterThan(sampleVeilProfile(0.9).mainShare);
  });

  it('groups similar particle sizes into coherent spatial patches', () => {
    const profile = sampleVeilProfile(0.45);
    const preference = sampleSizePreference(0.45, profile.mainCenter, profile);

    expect(sampleSizePreference(0.45, profile.mainCenter, profile)).toBe(preference);
    expect(Math.abs(sampleSizePreference(0.451, profile.mainCenter + 0.001, profile) - preference)).toBeLessThan(0.02);
  });

  it('shifts size groups toward larger grains in positive clusters and smaller ones in negative clusters', () => {
    expect(selectParticleSizeBand(0.84, 1).minimum).toBeGreaterThan(selectParticleSizeBand(0.84, -1).minimum);
    expect(selectParticleSizeBand(0.9985, 1).minimum).toBeGreaterThan(selectParticleSizeBand(0.9985, -1).minimum);
  });
});
