import mongoose from 'mongoose';
import Badge from '../../models/Badge';
import { mockBadge } from '../factories/badge.factory';

describe('Badge Model Test', () => {
  beforeAll(async () => {
    // Connection is handled by setup.ts
  });

  afterEach(async () => {
    // Cleanup is handled by setup.ts
  });

  afterAll(async () => {
    // Disconnection is handled by setup.ts
  });

  it('should create & save badge successfully', async () => {
    const validBadge = mockBadge();
    const savedBadge = await Badge.create(validBadge);
    expect(savedBadge._id).toBeDefined();
    expect(savedBadge.name).toBe(validBadge.name);
    expect(savedBadge.description).toBe(validBadge.description);
    expect(savedBadge.category).toBe(validBadge.category);
    expect(savedBadge.rarity).toBe(validBadge.rarity);
    expect(savedBadge.xpReward).toBe(validBadge.xpReward);
  });

  it('should fail to save badge without required fields', async () => {
    const badgeWithoutRequiredField = mockBadge({ name: undefined });
    let err: any;
    try {
      await Badge.create(badgeWithoutRequiredField);
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should validate badge category enum', async () => {
    const badgeWithInvalidCategory = mockBadge({ category: 'invalid' as any });
    let err: any;
    try {
      await Badge.create(badgeWithInvalidCategory);
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should validate badge rarity enum', async () => {
    const badgeWithInvalidRarity = mockBadge({ rarity: 'invalid' as any });
    let err: any;
    try {
      await Badge.create(badgeWithInvalidRarity);
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should validate xpReward is positive', async () => {
    const badgeWithNegativeXP = mockBadge({ xpReward: -50 });
    let err: any;
    try {
      await Badge.create(badgeWithNegativeXP);
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should generate slug from name', async () => {
    const badge = await Badge.create(mockBadge({ name: 'Test Badge' }));
    expect(badge.slug).toBe('test-badge');
  });

  it('should update badge criteria', async () => {
    const badge = await Badge.create(mockBadge());
    badge.criteria.description = 'Updated criteria';
    badge.criteria.requirements.count = 5;
    const updatedBadge = await badge.save();
    expect(updatedBadge?.criteria.description).toBe('Updated criteria');
    expect(updatedBadge?.criteria.requirements.count).toBe(5);
  });

  it('should update badge status', async () => {
    const badge = await Badge.create(mockBadge());
    badge.isActive = false;
    const updatedBadge = await badge.save();
    expect(updatedBadge?.isActive).toBe(false);
  });
}); 