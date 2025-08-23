/**
 * Content Versioning Service
 * Handles version control, collaboration, and content history
 */

import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';
import crypto from 'crypto';
import { diff_match_patch } from 'diff-match-patch';

interface ContentVersion {
  id: string;
  content_id: string;
  version_number: number;
  title: string;
  content: string;
  language: string;
  metadata: {
    word_count: number;
    compliance_score: number;
    ai_model_used?: string;
    generation_time?: number;
  };
  changes: {
    additions: number;
    deletions: number;
    diff?: string;
  };
  author_id: string;
  author_name: string;
  created_at: Date;
  is_published: boolean;
  is_approved: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  reviewer_id?: string;
  review_notes?: string;
  tags: string[];
}

interface ContentCollaboration {
  content_id: string;
  collaborators: {
    user_id: string;
    role: 'owner' | 'editor' | 'reviewer' | 'viewer';
    added_at: Date;
  }[];
  active_editors: string[];
  locked_sections: {
    section_id: string;
    locked_by: string;
    locked_at: Date;
  }[];
}

export class ContentVersioningService {
  private supabase: any;
  private diffTool: diff_match_patch;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.diffTool = new diff_match_patch();
  }

  /**
   * Create a new version of content
   */
  async createVersion(
    contentId: string,
    newContent: string,
    authorId: string,
    metadata?: any
  ): Promise<ContentVersion> {
    try {
      // Get current version
      const { data: currentVersion } = await this.supabase
        .from('content_versions')
        .select('*')
        .eq('content_id', contentId)
        .eq('is_current', true)
        .single();

      const versionNumber = currentVersion ? currentVersion.version_number + 1 : 1;
      
      // Calculate diff if not first version
      let changes = { additions: 0, deletions: 0, diff: '' };
      if (currentVersion) {
        changes = this.calculateDiff(currentVersion.content, newContent);
      }

      // Generate version hash
      const versionHash = this.generateVersionHash(newContent);

      // Create new version
      const newVersion: ContentVersion = {
        id: `v_${contentId}_${versionNumber}`,
        content_id: contentId,
        version_number: versionNumber,
        title: metadata?.title || `Version ${versionNumber}`,
        content: newContent,
        language: metadata?.language || 'en',
        metadata: {
          word_count: this.countWords(newContent),
          compliance_score: metadata?.compliance_score || 0,
          ai_model_used: metadata?.ai_model,
          generation_time: metadata?.generation_time
        },
        changes,
        author_id: authorId,
        author_name: await this.getAuthorName(authorId),
        created_at: new Date(),
        is_published: false,
        is_approved: false,
        approval_status: 'pending',
        tags: metadata?.tags || []
      };

      // Save version
      const { data, error } = await this.supabase
        .from('content_versions')
        .insert({
          ...newVersion,
          version_hash: versionHash,
          is_current: true
        });

      if (error) throw error;

      // Update previous version as not current
      if (currentVersion) {
        await this.supabase
          .from('content_versions')
          .update({ is_current: false })
          .eq('id', currentVersion.id);
      }

      // Update main content record
      await this.supabase
        .from('content')
        .update({
          current_version: versionNumber,
          last_modified: new Date(),
          last_modified_by: authorId
        })
        .eq('id', contentId);

      // Clear cache
      await redis.del(`content:${contentId}`);
      
      // Log activity
      await this.logActivity(contentId, authorId, 'version_created', {
        version: versionNumber
      });

      return newVersion;

    } catch (error) {
      console.error('Version creation failed:', error);
      throw new Error('Failed to create content version');
    }
  }

  /**
   * Get version history
   */
  async getVersionHistory(
    contentId: string,
    limit: number = 10
  ): Promise<ContentVersion[]> {
    try {
      const { data: versions } = await this.supabase
        .from('content_versions')
        .select('*')
        .eq('content_id', contentId)
        .order('version_number', { ascending: false })
        .limit(limit);

      return versions || [];

    } catch (error) {
      console.error('Failed to get version history:', error);
      throw new Error('Failed to retrieve version history');
    }
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    contentId: string,
    version1: number,
    version2: number
  ): Promise<{
    diff: string;
    changes: {
      additions: number;
      deletions: number;
      modifications: number;
    };
    visual_diff: string;
  }> {
    try {
      // Get both versions
      const { data: v1 } = await this.supabase
        .from('content_versions')
        .select('content')
        .eq('content_id', contentId)
        .eq('version_number', version1)
        .single();

      const { data: v2 } = await this.supabase
        .from('content_versions')
        .select('content')
        .eq('content_id', contentId)
        .eq('version_number', version2)
        .single();

      if (!v1 || !v2) {
        throw new Error('Version not found');
      }

      // Calculate diff
      const diffs = this.diffTool.diff_main(v1.content, v2.content);
      this.diffTool.diff_cleanupSemantic(diffs);

      // Generate visual diff (HTML)
      const visualDiff = this.diffTool.diff_prettyHtml(diffs);

      // Calculate statistics
      let additions = 0;
      let deletions = 0;
      let modifications = 0;

      diffs.forEach(([operation, text]) => {
        const words = this.countWords(text);
        if (operation === 1) additions += words;
        if (operation === -1) deletions += words;
      });

      // Estimate modifications (overlapping adds/deletes)
      modifications = Math.min(additions, deletions);

      return {
        diff: JSON.stringify(diffs),
        changes: {
          additions: additions - modifications,
          deletions: deletions - modifications,
          modifications
        },
        visual_diff: visualDiff
      };

    } catch (error) {
      console.error('Version comparison failed:', error);
      throw new Error('Failed to compare versions');
    }
  }

  /**
   * Revert to a previous version
   */
  async revertToVersion(
    contentId: string,
    versionNumber: number,
    authorId: string,
    reason: string
  ): Promise<ContentVersion> {
    try {
      // Get the version to revert to
      const { data: targetVersion } = await this.supabase
        .from('content_versions')
        .select('*')
        .eq('content_id', contentId)
        .eq('version_number', versionNumber)
        .single();

      if (!targetVersion) {
        throw new Error('Version not found');
      }

      // Create new version with reverted content
      const revertedVersion = await this.createVersion(
        contentId,
        targetVersion.content,
        authorId,
        {
          title: `Reverted to Version ${versionNumber}`,
          revert_reason: reason,
          reverted_from: versionNumber
        }
      );

      // Log revert activity
      await this.logActivity(contentId, authorId, 'version_reverted', {
        reverted_to: versionNumber,
        reason
      });

      return revertedVersion;

    } catch (error) {
      console.error('Version revert failed:', error);
      throw new Error('Failed to revert version');
    }
  }

  /**
   * Approve content version
   */
  async approveVersion(
    contentId: string,
    versionNumber: number,
    reviewerId: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('content_versions')
        .update({
          is_approved: true,
          approval_status: 'approved',
          reviewer_id: reviewerId,
          review_notes: notes,
          reviewed_at: new Date()
        })
        .eq('content_id', contentId)
        .eq('version_number', versionNumber);

      if (error) throw error;

      // Log approval
      await this.logActivity(contentId, reviewerId, 'version_approved', {
        version: versionNumber
      });

      // Notify author
      await this.notifyAuthor(contentId, 'approved', reviewerId);

      return true;

    } catch (error) {
      console.error('Version approval failed:', error);
      throw new Error('Failed to approve version');
    }
  }

  /**
   * Reject content version
   */
  async rejectVersion(
    contentId: string,
    versionNumber: number,
    reviewerId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('content_versions')
        .update({
          is_approved: false,
          approval_status: 'rejected',
          reviewer_id: reviewerId,
          review_notes: reason,
          reviewed_at: new Date()
        })
        .eq('content_id', contentId)
        .eq('version_number', versionNumber);

      if (error) throw error;

      // Log rejection
      await this.logActivity(contentId, reviewerId, 'version_rejected', {
        version: versionNumber,
        reason
      });

      // Notify author
      await this.notifyAuthor(contentId, 'rejected', reviewerId, reason);

      return true;

    } catch (error) {
      console.error('Version rejection failed:', error);
      throw new Error('Failed to reject version');
    }
  }

  /**
   * Publish content version
   */
  async publishVersion(
    contentId: string,
    versionNumber: number
  ): Promise<boolean> {
    try {
      // Check if version is approved
      const { data: version } = await this.supabase
        .from('content_versions')
        .select('is_approved')
        .eq('content_id', contentId)
        .eq('version_number', versionNumber)
        .single();

      if (!version?.is_approved) {
        throw new Error('Version must be approved before publishing');
      }

      // Update all versions to unpublished
      await this.supabase
        .from('content_versions')
        .update({ is_published: false })
        .eq('content_id', contentId);

      // Publish selected version
      const { error } = await this.supabase
        .from('content_versions')
        .update({
          is_published: true,
          published_at: new Date()
        })
        .eq('content_id', contentId)
        .eq('version_number', versionNumber);

      if (error) throw error;

      // Update main content record
      await this.supabase
        .from('content')
        .update({
          published_version: versionNumber,
          published_at: new Date()
        })
        .eq('id', contentId);

      // Clear cache
      await redis.del(`content:published:${contentId}`);

      return true;

    } catch (error) {
      console.error('Version publishing failed:', error);
      throw new Error('Failed to publish version');
    }
  }

  /**
   * Set up collaboration
   */
  async setupCollaboration(
    contentId: string,
    collaborators: Array<{
      user_id: string;
      role: 'editor' | 'reviewer' | 'viewer';
    }>
  ): Promise<ContentCollaboration> {
    try {
      const collaboration: ContentCollaboration = {
        content_id: contentId,
        collaborators: collaborators.map(c => ({
          ...c,
          role: c.role,
          added_at: new Date()
        })),
        active_editors: [],
        locked_sections: []
      };

      // Store collaboration settings
      const { error } = await this.supabase
        .from('content_collaborations')
        .upsert({
          content_id: contentId,
          collaborators: collaboration.collaborators,
          updated_at: new Date()
        });

      if (error) throw error;

      // Notify collaborators
      for (const collaborator of collaborators) {
        await this.notifyCollaborator(contentId, collaborator.user_id, collaborator.role);
      }

      return collaboration;

    } catch (error) {
      console.error('Collaboration setup failed:', error);
      throw new Error('Failed to setup collaboration');
    }
  }

  /**
   * Lock content section for editing
   */
  async lockSection(
    contentId: string,
    sectionId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const lockKey = `content:lock:${contentId}:${sectionId}`;
      
      // Check if already locked
      const existingLock = await redis.get(lockKey);
      if (existingLock && existingLock !== userId) {
        return false; // Already locked by another user
      }

      // Set lock with expiry
      await redis.setex(lockKey, 300, userId); // 5 minute lock

      // Update collaboration record
      await this.supabase
        .from('content_collaborations')
        .update({
          locked_sections: {
            section_id: sectionId,
            locked_by: userId,
            locked_at: new Date()
          }
        })
        .eq('content_id', contentId);

      return true;

    } catch (error) {
      console.error('Section locking failed:', error);
      throw new Error('Failed to lock section');
    }
  }

  /**
   * Auto-save draft
   */
  async autoSaveDraft(
    contentId: string,
    content: string,
    userId: string
  ): Promise<boolean> {
    try {
      const draftKey = `draft:${contentId}:${userId}`;
      
      // Save draft to Redis with 24 hour expiry
      await redis.setex(
        draftKey,
        86400,
        JSON.stringify({
          content,
          saved_at: new Date(),
          user_id: userId
        })
      );

      // Also save to database for persistence
      await this.supabase
        .from('content_drafts')
        .upsert({
          content_id: contentId,
          user_id: userId,
          content,
          saved_at: new Date()
        });

      return true;

    } catch (error) {
      console.error('Draft save failed:', error);
      return false; // Don't throw, as this is auto-save
    }
  }

  /**
   * Get draft
   */
  async getDraft(contentId: string, userId: string): Promise<string | null> {
    try {
      // Check Redis first
      const draftKey = `draft:${contentId}:${userId}`;
      const cached = await redis.get(draftKey);
      
      if (cached) {
        const draft = JSON.parse(cached);
        return draft.content;
      }

      // Fallback to database
      const { data } = await this.supabase
        .from('content_drafts')
        .select('content')
        .eq('content_id', contentId)
        .eq('user_id', userId)
        .single();

      return data?.content || null;

    } catch (error) {
      console.error('Draft retrieval failed:', error);
      return null;
    }
  }

  /**
   * Calculate diff between two contents
   */
  private calculateDiff(oldContent: string, newContent: string) {
    const diffs = this.diffTool.diff_main(oldContent, newContent);
    this.diffTool.diff_cleanupSemantic(diffs);

    let additions = 0;
    let deletions = 0;

    diffs.forEach(([operation, text]) => {
      const words = this.countWords(text);
      if (operation === 1) additions += words;
      if (operation === -1) deletions += words;
    });

    return {
      additions,
      deletions,
      diff: JSON.stringify(diffs)
    };
  }

  /**
   * Generate version hash
   */
  private generateVersionHash(content: string): string {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get author name
   */
  private async getAuthorName(authorId: string): Promise<string> {
    const { data } = await this.supabase
      .from('advisors')
      .select('name')
      .eq('id', authorId)
      .single();

    return data?.name || 'Unknown';
  }

  /**
   * Log activity
   */
  private async logActivity(
    contentId: string,
    userId: string,
    action: string,
    metadata?: any
  ) {
    await this.supabase
      .from('content_activity_log')
      .insert({
        content_id: contentId,
        user_id: userId,
        action,
        metadata,
        timestamp: new Date()
      });
  }

  /**
   * Notify author
   */
  private async notifyAuthor(
    contentId: string,
    status: string,
    reviewerId: string,
    reason?: string
  ) {
    // Implement notification logic
    console.log(`Notifying author of content ${contentId}: ${status}`);
  }

  /**
   * Notify collaborator
   */
  private async notifyCollaborator(
    contentId: string,
    userId: string,
    role: string
  ) {
    // Implement notification logic
    console.log(`Notifying collaborator ${userId} of role ${role} on content ${contentId}`);
  }

  /**
   * Archive old versions
   */
  async archiveOldVersions(contentId: string, keepVersions: number = 10): Promise<number> {
    try {
      // Get all versions
      const { data: versions } = await this.supabase
        .from('content_versions')
        .select('id, version_number')
        .eq('content_id', contentId)
        .order('version_number', { ascending: false });

      if (!versions || versions.length <= keepVersions) {
        return 0; // Nothing to archive
      }

      // Archive older versions
      const toArchive = versions.slice(keepVersions);
      const archiveIds = toArchive.map(v => v.id);

      // Move to archive table
      const { error } = await this.supabase
        .from('content_versions_archive')
        .insert(
          toArchive.map(v => ({
            ...v,
            archived_at: new Date()
          }))
        );

      if (error) throw error;

      // Delete from main table
      await this.supabase
        .from('content_versions')
        .delete()
        .in('id', archiveIds);

      return toArchive.length;

    } catch (error) {
      console.error('Version archiving failed:', error);
      throw new Error('Failed to archive versions');
    }
  }
}