import { NextRequest, NextResponse } from 'next/server';
import { queryMySQL } from '@/lib/db/mysql';
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
      if (!isNaN(targetTime.getTime()) && targetTime > new Date()) {
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
      await queryMySQL(
        `INSERT INTO \`recipes\` (
           \`id\`, \`slug\`, \`title\`, \`description\`, \`hero_image_url\`, \`status\`, \`scheduled_for\`, \`published_at\`
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           \`title\` = VALUES(\`title\`),
           \`description\` = VALUES(\`description\`),
           \`hero_image_url\` = VALUES(\`hero_image_url\`),
           \`status\` = VALUES(\`status\`),
           \`scheduled_for\` = VALUES(\`scheduled_for\`),
           \`published_at\` = VALUES(\`published_at\`)`,
        [
          postId,
          slug,
          title,
          subtitle || content || '',
          hero_image_url || '',
          status,
          scheduledDateString,
          publishedAt,
        ]
      );
    } else if (type === 'review') {
      await queryMySQL(
        `INSERT INTO \`reviews\` (
           \`id\`, \`slug\`, \`product_name\`, \`verdict_summary\`, \`hero_image_url\`, \`status\`, \`scheduled_for\`, \`published_at\`
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           \`product_name\` = VALUES(\`product_name\`),
           \`verdict_summary\` = VALUES(\`verdict_summary\`),
           \`hero_image_url\` = VALUES(\`hero_image_url\`),
           \`status\` = VALUES(\`status\`),
           \`scheduled_for\` = VALUES(\`scheduled_for\`),
           \`published_at\` = VALUES(\`published_at\`)`,
        [
          postId,
          slug,
          title,
          subtitle || content || '',
          hero_image_url || '',
          status,
          scheduledDateString,
          publishedAt,
        ]
      );
    } else {
      // Default: Article (News or Lifestyle)
      await queryMySQL(
        `INSERT INTO \`articles\` (
           \`id\`, \`slug\`, \`title\`, \`subtitle\`, \`category\`, \`hero_image_url\`, \`gallery_images\`,
           \`content\`, \`tags\`, \`author\`, \`read_time\`, \`is_breaking\`, \`shoppable_items\`, \`status\`, \`scheduled_for\`, \`published_at\`
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           \`title\` = VALUES(\`title\`),
           \`subtitle\` = VALUES(\`subtitle\`),
           \`category\` = VALUES(\`category\`),
           \`hero_image_url\` = VALUES(\`hero_image_url\`),
           \`gallery_images\` = VALUES(\`gallery_images\`),
           \`content\` = VALUES(\`content\`),
           \`tags\` = VALUES(\`tags\`),
           \`author\` = VALUES(\`author\`),
           \`read_time\` = VALUES(\`read_time\`),
           \`is_breaking\` = VALUES(\`is_breaking\`),
           \`shoppable_items\` = VALUES(\`shoppable_items\`),
           \`status\` = VALUES(\`status\`),
           \`scheduled_for\` = VALUES(\`scheduled_for\`),
           \`published_at\` = VALUES(\`published_at\`)`,
        [
          postId,
          slug,
          title,
          subtitle || '',
          category || 'gaming_news',
          hero_image_url || '',
          galleryJson,
          content || '',
          tagsJson,
          author || 'Editorial Staff',
          read_time || 5,
          is_breaking ? 1 : 0,
          shoppableJson,
          status,
          scheduledDateString,
          publishedAt,
        ]
      );
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
