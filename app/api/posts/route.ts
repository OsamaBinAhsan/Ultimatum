import { NextRequest, NextResponse } from 'next/server';
import { querySQLServer } from '@/lib/db/sqlserver';
import { platformStore } from '@/lib/data/store';
import type { PostStatus } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const {
      id,
      title,
      slug,
      subtitle,
      content,
      category,
      type = 'article', // 'article' | 'recipe' | 'review'
      author,
      hero_image_url,
      gallery_images,
      tags,
      read_time,
      is_breaking,
      shoppable_items,
      scheduled_for,
    } = payload;

    if (!title || !slug) {
      return NextResponse.json(
        { success: false, error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    // Time & State Scheduling Logic
    let status: PostStatus = 'published';
    let scheduledDateString: string | null = null;
    let publishedAt: string | null = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (scheduled_for) {
      const targetTime = new Date(scheduled_for);
      if (!isNaN(targetTime.getTime()) && targetTime.getTime() > Date.now()) {
        status = 'scheduled';
        scheduledDateString = targetTime.toISOString().slice(0, 19).replace('T', ' ');
        publishedAt = null;
      }
    }

    const postId = id || `post-${Date.now()}`;
    const galleryJson = gallery_images ? JSON.stringify(gallery_images) : null;
    const tagsJson = tags ? JSON.stringify(tags) : null;
    const shoppableJson = shoppable_items ? JSON.stringify(shoppable_items) : null;

    if (type === 'recipe') {
      try {
        await querySQLServer(
          `IF EXISTS (SELECT 1 FROM [recipes] WHERE [id] = ? OR [slug] = ?)
           BEGIN
             UPDATE [recipes]
             SET [title] = ?, [description] = ?, [hero_image_url] = ?, [status] = ?,
                 [scheduled_for] = ?, [published_at] = ?, [updated_at] = GETUTCDATE()
             WHERE [id] = ? OR [slug] = ?
           END
           ELSE
           BEGIN
             INSERT INTO [recipes] ([id], [slug], [title], [description], [hero_image_url], [status], [scheduled_for], [published_at], [prep_time], [cook_time], [servings], [calories], [category], [ingredients], [instructions], [author], [created_at], [updated_at])
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 15, 20, 4, 400, ?, '[]', '[]', ?, GETUTCDATE(), GETUTCDATE())
           END`,
          [
            // IF EXISTS
            postId, slug,
            // UPDATE
            title, subtitle || content || '', hero_image_url || '', status, scheduledDateString, publishedAt,
            postId, slug,
            // INSERT
            postId, slug, title, subtitle || content || '', hero_image_url || '', status, scheduledDateString, publishedAt, category || 'Entree', author || 'Chef'
          ]
        );
      } catch (dbErr) {
        console.warn('SQL Server post recipe skipped:', dbErr);
      }

      platformStore.saveRecipe({
        id: postId,
        slug,
        title,
        description: subtitle || content || '',
        hero_image_url: hero_image_url || '',
        prep_time: 15,
        cook_time: 20,
        servings: 4,
        calories: 400,
        category: category || 'Entree',
        dietary_tags: [],
        ingredients: [],
        instructions: [],
        rating: 5,
        rating_count: 1,
        author: author || 'Chef',
        created_at: new Date().toISOString(),
        status,
        scheduled_for: scheduledDateString,
        published_at: publishedAt,
      });
    } else if (type === 'review') {
      try {
        await querySQLServer(
          `IF EXISTS (SELECT 1 FROM [reviews] WHERE [id] = ? OR [slug] = ?)
           BEGIN
             UPDATE [reviews]
             SET [product_name] = ?, [summary] = ?, [hero_image_url] = ?, [status] = ?,
                 [scheduled_for] = ?, [published_at] = ?, [updated_at] = GETUTCDATE()
             WHERE [id] = ? OR [slug] = ?
           END
           ELSE
           BEGIN
             INSERT INTO [reviews] ([id], [slug], [product_name], [summary], [verdict], [category], [rating], [pros], [cons], [specifications], [hero_image_url], [author], [status], [scheduled_for], [published_at], [created_at], [updated_at])
             VALUES (?, ?, ?, ?, ?, ?, 4.5, '[]', '[]', '{}', ?, ?, ?, ?, ?, GETUTCDATE(), GETUTCDATE())
           END`,
          [
            // IF EXISTS
            postId, slug,
            // UPDATE
            title, subtitle || content || '', hero_image_url || '', status, scheduledDateString, publishedAt,
            postId, slug,
            // INSERT
            postId, slug, title, subtitle || '', content || '', category || 'tech_hardware', hero_image_url || '', author || 'Ultimatum Lab', status, scheduledDateString, publishedAt
          ]
        );
      } catch (dbErr) {
        console.warn('SQL Server post review skipped:', dbErr);
      }

      platformStore.saveReview({
        id: postId,
        slug,
        product_name: title,
        category: category || 'tech_hardware',
        rating: 4.5,
        summary: subtitle || '',
        verdict: content || '',
        pros: [],
        cons: [],
        specifications: {},
        hero_image_url: hero_image_url || '',
        author: author || 'Ultimatum Lab',
        created_at: new Date().toISOString(),
        status,
        scheduled_for: scheduledDateString,
        published_at: publishedAt,
      });
    } else {
      // Default: Article (News or Lifestyle)
      try {
        await querySQLServer(
          `IF EXISTS (SELECT 1 FROM [articles] WHERE [id] = ? OR [slug] = ?)
           BEGIN
             UPDATE [articles]
             SET [slug] = ?, [title] = ?, [subtitle] = ?, [category] = ?, [hero_image_url] = ?,
                 [gallery_images] = ?, [content] = ?, [tags] = ?, [author] = ?, [read_time] = ?,
                 [is_breaking] = ?, [shoppable_items] = ?, [status] = ?, [scheduled_for] = ?,
                 [published_at] = ?, [updated_at] = GETUTCDATE()
             WHERE [id] = ? OR [slug] = ?
           END
           ELSE
           BEGIN
             INSERT INTO [articles] ([id], [slug], [title], [subtitle], [category], [hero_image_url], [gallery_images], [content], [tags], [author], [read_time], [is_breaking], [shoppable_items], [status], [scheduled_for], [published_at], [created_at], [updated_at])
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETUTCDATE(), GETUTCDATE())
           END`,
          [
            // IF EXISTS
            postId, slug,
            // UPDATE
            slug, title, subtitle || '', category || 'gaming_news', hero_image_url || '', galleryJson, content || '', tagsJson, author || 'Editorial Staff', read_time || 5, is_breaking ? 1 : 0, shoppableJson, status, scheduledDateString, publishedAt,
            postId, slug,
            // INSERT
            postId, slug, title, subtitle || '', category || 'gaming_news', hero_image_url || '', galleryJson, content || '', tagsJson, author || 'Editorial Staff', read_time || 5, is_breaking ? 1 : 0, shoppableJson, status, scheduledDateString, publishedAt
          ]
        );
      } catch (dbErr) {
        console.warn('SQL Server post article skipped:', dbErr);
      }

      platformStore.saveArticle({
        id: postId,
        slug,
        title,
        subtitle: subtitle || '',
        category: category || 'gaming_news',
        hero_image_url: hero_image_url || '',
        gallery_images: gallery_images || [],
        content: content || '',
        tags: tags || [],
        author: author || 'Editorial Staff',
        read_time: read_time || 5,
        is_breaking: is_breaking || false,
        shoppable_items: shoppable_items || [],
        published_at: publishedAt || new Date().toISOString(),
        created_at: new Date().toISOString(),
        status,
        scheduled_for: scheduledDateString,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Post ${status === 'scheduled' ? 'scheduled' : 'published'} successfully`,
      post: {
        id: postId,
        slug,
        title,
        status,
        scheduled_for: scheduledDateString,
        published_at: publishedAt,
      },
    });
  } catch (err: unknown) {
    const e = err as Error;
    console.error('Error saving post:', e);
    return NextResponse.json(
      { success: false, error: e.message || 'Failed to save post to database' },
      { status: 500 }
    );
  }
}


