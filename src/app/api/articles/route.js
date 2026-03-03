import { NextResponse } from 'next/server';
import { getArticles, getAvailableDates } from '../../../lib/db.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // JST (UTC+9) で今日の日付を取得
    const now = new Date();
    const jstOffset = 9 * 60 * 60 * 1000;
    const jstDate = new Date(now.getTime() + jstOffset);
    const todayJST = jstDate.toISOString().split('T')[0];
    const date = searchParams.get('date') || todayJST;
    const category = searchParams.get('category') || null;
    const importance = searchParams.get('importance') || null;
    const search = searchParams.get('search') || null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await getArticles({ date, category, importance, search, page, limit });

    // 利用可能な日付一覧も返す
    const availableDates = await getAvailableDates();

    return NextResponse.json({
      ...result,
      date,
      availableDates,
    });
  } catch (error) {
    // DB未接続時は空データを返す（UIが正常に表示できるように）
    if (error.message?.includes('DATABASE_URL')) {
      return NextResponse.json({
        articles: [],
        total: 0,
        categories: {},
        date: new Date().toISOString().split('T')[0],
        availableDates: [],
        notice: 'Database not connected. Set DATABASE_URL in environment variables.',
      });
    }
    console.error('Articles API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles', details: error.message },
      { status: 500 }
    );
  }
}
