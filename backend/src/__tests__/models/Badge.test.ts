import Badge, { IBadge } from '../../models/Badge';
import mongoose from 'mongoose';

describe('Badge Model', () => {
  let testBadge: IBadge;

  beforeEach(async () => {
    // Clear the collection
    await Badge.deleteMany({});

    // Create test badge
    testBadge = await Badge.create({
      name: 'Test Badge',
      description: 'Test Badge Description',
      icon: 'test-icon.svg',
      category: 'achievement',
      requirements: { count: 5, type: 'notes' },
      xpReward: 100,
      rarity: 'uncommon',
      isActive: true,
      displayOrder: 10
    });
  });

  describe('Badge Creation', () => {
    it('should create a badge successfully', async () => {
      expect(testBadge).toBeDefined();
      expect(testBadge.name).toBe('Test Badge');
      expect(testBadge.description).toBe('Test Badge Description');
      expect(testBadge.category).toBe('achievement');
      expect(testBadge.rarity).toBe('uncommon');
    });

    it('should require name', async () => {
      await expect(
        Badge.create({
          description: 'Test Badge Description',
          icon: 'test-icon.svg',
          category: 'achievement',
          requirements: { count: 5, type: 'notes' }
        })
      ).rejects.toThrow();
    });

    it('should require description', async () => {
      await expect(
        Badge.create({
          name: 'Test Badge',
          icon: 'test-icon.svg',
          category: 'achievement',
          requirements: { count: 5, type: 'notes' }
        })
      ).rejects.toThrow();
    });

    it('should require icon', async () => {
      await expect(
        Badge.create({
          name: 'Test Badge',
          description: 'Test Badge Description',
          category: 'achievement',
          requirements: { count: 5, type: 'notes' }
        })
      ).rejects.toThrow();
    });

    it('should require category', async () => {
      await expect(
        Badge.create({
          name: 'Test Badge',
          description: 'Test Badge Description',
          icon: 'test-icon.svg',
          requirements: { count: 5, type: 'notes' }
        })
      ).rejects.toThrow();
    });

    it('should validate category enum values', async () => {
      await expect(
        Badge.create({
          name: 'Test Badge',
          description: 'Test Badge Description',
          icon: 'test-icon.svg',
          category: 'invalid-category',
          requirements: { count: 5, type: 'notes' }
        })
      ).rejects.toThrow();
    });

    it('should validate rarity enum values', async () => {
      await expect(
        Badge.create({
          name: 'Test Badge',
          description: 'Test Badge Description',
          icon: 'test-icon.svg',
          category: 'achievement',
          requirements: { count: 5, type: 'notes' },
          rarity: 'invalid-rarity'
        })
      ).rejects.toThrow();
    });
  });

  describe('Badge Slug', () => {
    it('should generate slug from name', async () => {
      expect(testBadge.slug).toBe('test-badge');
    });

    it('should update slug when name changes', async () => {
      testBadge.name = 'Updated Test Badge';
      await testBadge.save();
      expect(testBadge.slug).toBe('updated-test-badge');
    });
  });

  describe('Badge Uniqueness', () => {
    it('should enforce unique badge names', async () => {
      await expect(
        Badge.create({
          name: 'Test Badge', // Same name
          description: 'Another Description',
          icon: 'another-icon.svg',
          category: 'streak',
          requirements: { days: 7 }
        })
      ).rejects.toThrow();
    });
  });
}); 