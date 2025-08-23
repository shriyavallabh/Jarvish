/**
 * Content Versioning Service Unit Tests
 * Testing version control and collaboration features
 */

import { ContentVersioningService } from '@/lib/services/content-versioning';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';
import crypto from 'crypto';
import { diff_match_patch } from 'diff-match-patch';

// Mock external dependencies
jest.mock('@supabase/supabase-js');
jest.mock('@/lib/redis');
jest.mock('crypto');
jest.mock('diff-match-patch');

describe('ContentVersioningService', () => {
  let versioningService: ContentVersioningService;
  let mockSupabase: any;
  let mockRedis: any;
  let mockDiffTool: any;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    };

    // Mock Redis client
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn()
    };

    // Mock diff tool
    mockDiffTool = {
      diff_main: jest.fn(),
      diff_cleanupSemantic: jest.fn(),
      diff_prettyHtml: jest.fn()
    };

    // Mock crypto
    (crypto.createHash as jest.Mock) = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('version_hash_123')
    });

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    (redis.get as jest.Mock) = mockRedis.get;
    (redis.setex as jest.Mock) = mockRedis.setex;
    (redis.del as jest.Mock) = mockRedis.del;

    (diff_match_patch as jest.Mock).mockImplementation(() => mockDiffTool);

    // Create service instance
    versioningService = new ContentVersioningService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createVersion', () => {
    it('should create first version of content', async () => {
      const contentId = 'content_123';
      const newContent = 'This is the first version of the content.';
      const authorId = 'advisor_456';
      const metadata = {
        title: 'Investment Guide',
        language: 'en',
        compliance_score: 98,
        tags: ['mutual-funds', 'sip']
      };

      // No existing version
      mockSupabase.single.mockResolvedValue({
        data: null
      });

      // Mock author name lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: { name: 'John Advisor' }
      });

      // Mock version insert
      mockSupabase.insert.mockResolvedValue({
        data: { id: 'v_content_123_1' },
        error: null
      });

      // Mock content update
      mockSupabase.update.mockResolvedValue({
        error: null
      });

      const result = await versioningService.createVersion(
        contentId,
        newContent,
        authorId,
        metadata
      );

      expect(result).toEqual({
        id: 'v_content_123_1',
        content_id: contentId,
        version_number: 1,
        title: 'Investment Guide',
        content: newContent,
        language: 'en',
        metadata: {
          word_count: 7,
          compliance_score: 98,
          ai_model_used: undefined,
          generation_time: undefined
        },
        changes: {
          additions: 0,
          deletions: 0,
          diff: ''
        },
        author_id: authorId,
        author_name: 'John Advisor',
        created_at: expect.any(Date),
        is_published: false,
        is_approved: false,
        approval_status: 'pending',
        tags: ['mutual-funds', 'sip']
      });

      expect(mockRedis.del).toHaveBeenCalledWith(`content:${contentId}`);
    });

    it('should create new version with diff calculation', async () => {
      const contentId = 'content_123';
      const oldContent = 'Original content here.';
      const newContent = 'Updated content with changes here.';
      const authorId = 'advisor_456';

      // Mock existing version
      mockSupabase.single.mockResolvedValue({
        data: {
          content: oldContent,
          version_number: 1
        }
      });

      // Mock author name
      mockSupabase.single.mockResolvedValueOnce({
        data: { name: 'Jane Advisor' }
      });

      // Mock diff calculation
      mockDiffTool.diff_main.mockReturnValue([
        [-1, 'Original'],
        [1, 'Updated'],
        [0, ' content '],
        [1, 'with changes '],
        [0, 'here.']
      ]);

      // Mock insert and update
      mockSupabase.insert.mockResolvedValue({ error: null });
      mockSupabase.update.mockResolvedValue({ error: null });

      const result = await versioningService.createVersion(
        contentId,
        newContent,
        authorId
      );

      expect(result.version_number).toBe(2);
      expect(result.changes.additions).toBeGreaterThan(0);
      expect(result.changes.deletions).toBeGreaterThan(0);
      expect(result.changes.diff).toBeTruthy();

      // Verify previous version marked as not current
      expect(mockSupabase.update).toHaveBeenCalledWith({ is_current: false });
    });

    it('should handle version creation failure', async () => {
      const contentId = 'content_123';

      mockSupabase.single.mockResolvedValue({ data: null });
      mockSupabase.insert.mockResolvedValue({
        error: new Error('Database error')
      });

      await expect(
        versioningService.createVersion(contentId, 'content', 'advisor_123')
      ).rejects.toThrow('Failed to create content version');
    });
  });

  describe('getVersionHistory', () => {
    it('should retrieve version history', async () => {
      const contentId = 'content_123';
      const versions = [
        {
          id: 'v_content_123_3',
          version_number: 3,
          content: 'Latest version',
          created_at: new Date('2024-01-20')
        },
        {
          id: 'v_content_123_2',
          version_number: 2,
          content: 'Second version',
          created_at: new Date('2024-01-15')
        },
        {
          id: 'v_content_123_1',
          version_number: 1,
          content: 'First version',
          created_at: new Date('2024-01-10')
        }
      ];

      mockSupabase.limit.mockResolvedValue({
        data: versions
      });

      const result = await versioningService.getVersionHistory(contentId, 10);

      expect(result).toEqual(versions);
      expect(mockSupabase.order).toHaveBeenCalledWith(
        'version_number',
        { ascending: false }
      );
      expect(mockSupabase.limit).toHaveBeenCalledWith(10);
    });

    it('should handle empty version history', async () => {
      mockSupabase.limit.mockResolvedValue({
        data: null
      });

      const result = await versioningService.getVersionHistory('content_123');

      expect(result).toEqual([]);
    });
  });

  describe('compareVersions', () => {
    it('should compare two versions and generate diff', async () => {
      const contentId = 'content_123';
      const v1Content = 'Original financial advice content.';
      const v2Content = 'Updated financial advisory content with more details.';

      // Mock version fetches
      mockSupabase.single.mockResolvedValueOnce({
        data: { content: v1Content }
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { content: v2Content }
      });

      // Mock diff operations
      const diffs = [
        [-1, 'Original'],
        [1, 'Updated'],
        [0, ' financial '],
        [-1, 'advice'],
        [1, 'advisory'],
        [0, ' content'],
        [1, ' with more details'],
        [0, '.']
      ];

      mockDiffTool.diff_main.mockReturnValue(diffs);
      mockDiffTool.diff_prettyHtml.mockReturnValue(
        '<del>Original</del><ins>Updated</ins> financial <del>advice</del><ins>advisory</ins> content<ins> with more details</ins>.'
      );

      const result = await versioningService.compareVersions(contentId, 1, 2);

      expect(result).toEqual({
        diff: JSON.stringify(diffs),
        changes: {
          additions: expect.any(Number),
          deletions: expect.any(Number),
          modifications: expect.any(Number)
        },
        visual_diff: expect.stringContaining('<del>')
      });

      expect(mockDiffTool.diff_cleanupSemantic).toHaveBeenCalled();
    });

    it('should handle version not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null });

      await expect(
        versioningService.compareVersions('content_123', 1, 2)
      ).rejects.toThrow('Version not found');
    });
  });

  describe('revertToVersion', () => {
    it('should revert to previous version', async () => {
      const contentId = 'content_123';
      const targetVersion = 2;
      const authorId = 'advisor_456';
      const reason = 'Compliance issue in version 3';

      // Mock target version fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          content: 'Version 2 content',
          version_number: 2
        }
      });

      // Mock createVersion call
      jest.spyOn(versioningService, 'createVersion').mockResolvedValue({
        id: 'v_content_123_4',
        content_id: contentId,
        version_number: 4,
        title: `Reverted to Version ${targetVersion}`,
        content: 'Version 2 content',
        language: 'en',
        metadata: {
          word_count: 3,
          compliance_score: 0,
          revert_reason: reason,
          reverted_from: targetVersion
        },
        changes: { additions: 0, deletions: 0, diff: '' },
        author_id: authorId,
        author_name: 'John Advisor',
        created_at: new Date(),
        is_published: false,
        is_approved: false,
        approval_status: 'pending',
        tags: []
      });

      // Mock activity logging
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await versioningService.revertToVersion(
        contentId,
        targetVersion,
        authorId,
        reason
      );

      expect(result.title).toContain('Reverted to Version 2');
      expect(versioningService.createVersion).toHaveBeenCalledWith(
        contentId,
        'Version 2 content',
        authorId,
        expect.objectContaining({
          revert_reason: reason,
          reverted_from: targetVersion
        })
      );
    });

    it('should handle version not found during revert', async () => {
      mockSupabase.single.mockResolvedValue({ data: null });

      await expect(
        versioningService.revertToVersion('content_123', 99, 'advisor_123', 'reason')
      ).rejects.toThrow('Version not found');
    });
  });

  describe('approveVersion', () => {
    it('should approve content version', async () => {
      const contentId = 'content_123';
      const versionNumber = 3;
      const reviewerId = 'reviewer_789';
      const notes = 'Approved for publication';

      mockSupabase.update.mockResolvedValue({ error: null });
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await versioningService.approveVersion(
        contentId,
        versionNumber,
        reviewerId,
        notes
      );

      expect(result).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        is_approved: true,
        approval_status: 'approved',
        reviewer_id: reviewerId,
        review_notes: notes,
        reviewed_at: expect.any(Date)
      });
    });

    it('should handle approval failure', async () => {
      mockSupabase.update.mockResolvedValue({
        error: new Error('Update failed')
      });

      await expect(
        versioningService.approveVersion('content_123', 1, 'reviewer_123')
      ).rejects.toThrow('Failed to approve version');
    });
  });

  describe('rejectVersion', () => {
    it('should reject content version with reason', async () => {
      const contentId = 'content_123';
      const versionNumber = 2;
      const reviewerId = 'reviewer_789';
      const reason = 'Contains promotional language';

      mockSupabase.update.mockResolvedValue({ error: null });
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await versioningService.rejectVersion(
        contentId,
        versionNumber,
        reviewerId,
        reason
      );

      expect(result).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        is_approved: false,
        approval_status: 'rejected',
        reviewer_id: reviewerId,
        review_notes: reason,
        reviewed_at: expect.any(Date)
      });
    });
  });

  describe('publishVersion', () => {
    it('should publish approved version', async () => {
      const contentId = 'content_123';
      const versionNumber = 3;

      // Version is approved
      mockSupabase.single.mockResolvedValue({
        data: { is_approved: true }
      });

      mockSupabase.update.mockResolvedValue({ error: null });

      const result = await versioningService.publishVersion(contentId, versionNumber);

      expect(result).toBe(true);

      // Verify all versions unpublished first
      expect(mockSupabase.update).toHaveBeenCalledWith({ is_published: false });

      // Verify selected version published
      expect(mockSupabase.update).toHaveBeenCalledWith({
        is_published: true,
        published_at: expect.any(Date)
      });

      expect(mockRedis.del).toHaveBeenCalledWith(`content:published:${contentId}`);
    });

    it('should reject publishing unapproved version', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { is_approved: false }
      });

      await expect(
        versioningService.publishVersion('content_123', 2)
      ).rejects.toThrow('Version must be approved before publishing');
    });
  });

  describe('setupCollaboration', () => {
    it('should setup collaboration with multiple users', async () => {
      const contentId = 'content_123';
      const collaborators = [
        { user_id: 'user_1', role: 'editor' as const },
        { user_id: 'user_2', role: 'reviewer' as const },
        { user_id: 'user_3', role: 'viewer' as const }
      ];

      mockSupabase.upsert.mockResolvedValue({ error: null });

      const result = await versioningService.setupCollaboration(contentId, collaborators);

      expect(result).toEqual({
        content_id: contentId,
        collaborators: expect.arrayContaining([
          expect.objectContaining({
            user_id: 'user_1',
            role: 'editor',
            added_at: expect.any(Date)
          })
        ]),
        active_editors: [],
        locked_sections: []
      });

      expect(mockSupabase.upsert).toHaveBeenCalledWith({
        content_id: contentId,
        collaborators: expect.any(Array),
        updated_at: expect.any(Date)
      });
    });

    it('should handle collaboration setup failure', async () => {
      mockSupabase.upsert.mockResolvedValue({
        error: new Error('Database error')
      });

      await expect(
        versioningService.setupCollaboration('content_123', [])
      ).rejects.toThrow('Failed to setup collaboration');
    });
  });

  describe('lockSection', () => {
    it('should lock section for editing', async () => {
      const contentId = 'content_123';
      const sectionId = 'section_1';
      const userId = 'user_456';

      mockRedis.get.mockResolvedValue(null); // No existing lock
      mockRedis.setex.mockResolvedValue('OK');
      mockSupabase.update.mockResolvedValue({ error: null });

      const result = await versioningService.lockSection(contentId, sectionId, userId);

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `content:lock:${contentId}:${sectionId}`,
        300, // 5 minutes
        userId
      );
    });

    it('should prevent locking already locked section', async () => {
      const contentId = 'content_123';
      const sectionId = 'section_1';

      mockRedis.get.mockResolvedValue('different_user');

      const result = await versioningService.lockSection(contentId, sectionId, 'user_456');

      expect(result).toBe(false);
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should allow same user to extend lock', async () => {
      const contentId = 'content_123';
      const sectionId = 'section_1';
      const userId = 'user_456';

      mockRedis.get.mockResolvedValue(userId); // Same user has lock
      mockRedis.setex.mockResolvedValue('OK');
      mockSupabase.update.mockResolvedValue({ error: null });

      const result = await versioningService.lockSection(contentId, sectionId, userId);

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalled();
    });
  });

  describe('autoSaveDraft', () => {
    it('should auto-save draft to Redis and database', async () => {
      const contentId = 'content_123';
      const content = 'Draft content being edited...';
      const userId = 'user_456';

      mockRedis.setex.mockResolvedValue('OK');
      mockSupabase.upsert.mockResolvedValue({ error: null });

      const result = await versioningService.autoSaveDraft(contentId, content, userId);

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `draft:${contentId}:${userId}`,
        86400, // 24 hours
        expect.stringContaining(content)
      );
      expect(mockSupabase.upsert).toHaveBeenCalledWith({
        content_id: contentId,
        user_id: userId,
        content,
        saved_at: expect.any(Date)
      });
    });

    it('should not throw on draft save failure', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      const result = await versioningService.autoSaveDraft('content_123', 'draft', 'user_123');

      expect(result).toBe(false);
    });
  });

  describe('getDraft', () => {
    it('should retrieve draft from Redis cache', async () => {
      const contentId = 'content_123';
      const userId = 'user_456';
      const draftContent = 'Cached draft content';

      mockRedis.get.mockResolvedValue(JSON.stringify({
        content: draftContent,
        saved_at: new Date(),
        user_id: userId
      }));

      const result = await versioningService.getDraft(contentId, userId);

      expect(result).toBe(draftContent);
      expect(mockSupabase.select).not.toHaveBeenCalled();
    });

    it('should fallback to database when cache miss', async () => {
      const contentId = 'content_123';
      const userId = 'user_456';
      const draftContent = 'Database draft content';

      mockRedis.get.mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({
        data: { content: draftContent }
      });

      const result = await versioningService.getDraft(contentId, userId);

      expect(result).toBe(draftContent);
    });

    it('should return null when no draft exists', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({ data: null });

      const result = await versioningService.getDraft('content_123', 'user_456');

      expect(result).toBeNull();
    });
  });

  describe('archiveOldVersions', () => {
    it('should archive old versions keeping specified count', async () => {
      const contentId = 'content_123';
      const keepVersions = 5;
      const versions = Array.from({ length: 10 }, (_, i) => ({
        id: `v_${i + 1}`,
        version_number: 10 - i
      }));

      mockSupabase.order.mockResolvedValue({
        data: versions
      });

      mockSupabase.insert.mockResolvedValue({ error: null });
      mockSupabase.in.mockResolvedValue({
        data: { deleted: 5 }
      });

      const result = await versioningService.archiveOldVersions(contentId, keepVersions);

      expect(result).toBe(5);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            archived_at: expect.any(Date)
          })
        ])
      );
    });

    it('should not archive when versions below threshold', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [
          { id: 'v_1', version_number: 3 },
          { id: 'v_2', version_number: 2 },
          { id: 'v_3', version_number: 1 }
        ]
      });

      const result = await versioningService.archiveOldVersions('content_123', 5);

      expect(result).toBe(0);
      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });

    it('should handle archiving errors', async () => {
      mockSupabase.order.mockResolvedValue({
        data: Array.from({ length: 10 }, (_, i) => ({
          id: `v_${i}`,
          version_number: i
        }))
      });

      mockSupabase.insert.mockResolvedValue({
        error: new Error('Archive failed')
      });

      await expect(
        versioningService.archiveOldVersions('content_123', 5)
      ).rejects.toThrow('Failed to archive versions');
    });
  });

  describe('Word Count and Hashing', () => {
    it('should accurately count words', async () => {
      const content = '  This   is a   test  content with   multiple   spaces.  ';
      
      mockSupabase.single.mockResolvedValue({ data: null });
      mockSupabase.single.mockResolvedValueOnce({
        data: { name: 'Test Author' }
      });
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await versioningService.createVersion(
        'content_123',
        content,
        'author_123'
      );

      expect(result.metadata.word_count).toBe(8);
    });

    it('should generate consistent version hash', async () => {
      const content = 'Test content for hashing';

      mockSupabase.single.mockResolvedValue({ data: null });
      mockSupabase.single.mockResolvedValueOnce({
        data: { name: 'Test Author' }
      });
      mockSupabase.insert.mockResolvedValue({ error: null });

      await versioningService.createVersion('content_123', content, 'author_123');

      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
    });
  });
});