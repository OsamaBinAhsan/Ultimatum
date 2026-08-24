import {
  INITIAL_GAMES,
  INITIAL_RECIPES,
  INITIAL_REVIEWS,
  INITIAL_ARTICLES,
  INITIAL_SPONSORS,
  INITIAL_PAGES,
  INITIAL_SETTINGS,
  INITIAL_LEADERBOARD,
  INITIAL_PROFILES,
} from './mock-data';
import {
  Game,
  Recipe,
  Review,
  Article,
  Sponsor,
  CustomPage,
  SiteSettings,
  LeaderboardEntry,
  Profile,
  Bookmark,
} from '@/lib/types';

class PlatformStore {
  private games: Game[] = [...INITIAL_GAMES];
  private recipes: Recipe[] = [...INITIAL_RECIPES];
  private reviews: Review[] = [...INITIAL_REVIEWS];
  private articles: Article[] = [...INITIAL_ARTICLES];
  private sponsors: Sponsor[] = [...INITIAL_SPONSORS];
  private pages: CustomPage[] = [...INITIAL_PAGES];
  private settings: SiteSettings = { ...INITIAL_SETTINGS };
  private leaderboard: LeaderboardEntry[] = [...INITIAL_LEADERBOARD];
  private profiles: Profile[] = [...INITIAL_PROFILES];
  private bookmarks: Bookmark[] = [];
  private currentUser: Profile | null = INITIAL_PROFILES[0]; // Super Admin default
  private pendingScore: { gameId: string; score: number } | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromLocalStorage();
    }
  }

  private saveToLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('ultimatum_games', JSON.stringify(this.games));
      localStorage.setItem('ultimatum_recipes', JSON.stringify(this.recipes));
      localStorage.setItem('ultimatum_reviews', JSON.stringify(this.reviews));
      localStorage.setItem('ultimatum_articles', JSON.stringify(this.articles));
      localStorage.setItem('ultimatum_sponsors', JSON.stringify(this.sponsors));
      localStorage.setItem('ultimatum_pages', JSON.stringify(this.pages));
      localStorage.setItem('ultimatum_settings', JSON.stringify(this.settings));
      localStorage.setItem('ultimatum_leaderboard', JSON.stringify(this.leaderboard));
      localStorage.setItem('ultimatum_profiles', JSON.stringify(this.profiles));
      localStorage.setItem('ultimatum_bookmarks', JSON.stringify(this.bookmarks));
      if (this.currentUser) {
        localStorage.setItem('ultimatum_current_user', JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem('ultimatum_current_user');
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  private loadFromLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const g = localStorage.getItem('ultimatum_games');
      if (g) {
        const storedGames: Game[] = JSON.parse(g);
        const existingIds = new Set(storedGames.map((item) => item.id || item.slug));
        const missingGames = INITIAL_GAMES.filter(
          (item) => !existingIds.has(item.id) && !existingIds.has(item.slug)
        );
        this.games = [...storedGames, ...missingGames];
      }
      const r = localStorage.getItem('ultimatum_recipes');
      if (r) {
        const storedRecipes: Recipe[] = JSON.parse(r);
        const existingIds = new Set(storedRecipes.map((item) => item.id || item.slug));
        const missingRecipes = INITIAL_RECIPES.filter(
          (item) => !existingIds.has(item.id) && !existingIds.has(item.slug)
        );
        this.recipes = [...storedRecipes, ...missingRecipes];
      }
      const rev = localStorage.getItem('ultimatum_reviews');
      if (rev) {
        const storedReviews: Review[] = JSON.parse(rev);
        const existingIds = new Set(storedReviews.map((item) => item.id || item.slug));
        const missingReviews = INITIAL_REVIEWS.filter(
          (item) => !existingIds.has(item.id) && !existingIds.has(item.slug)
        );
        this.reviews = [...storedReviews, ...missingReviews];
      }
      const a = localStorage.getItem('ultimatum_articles');
      if (a) {
        const storedArticles: Article[] = JSON.parse(a);
        const existingIds = new Set(storedArticles.map((item) => item.id || item.slug));
        const missingArticles = INITIAL_ARTICLES.filter(
          (item) => !existingIds.has(item.id) && !existingIds.has(item.slug)
        );
        this.articles = [...storedArticles, ...missingArticles];
      }
      const s = localStorage.getItem('ultimatum_sponsors');
      if (s) this.sponsors = JSON.parse(s);
      const p = localStorage.getItem('ultimatum_pages');
      if (p) this.pages = JSON.parse(p);
      const set = localStorage.getItem('ultimatum_settings');
      if (set) this.settings = JSON.parse(set);
      const lb = localStorage.getItem('ultimatum_leaderboard');
      if (lb) {
        const storedLb: LeaderboardEntry[] = JSON.parse(lb);
        const existingIds = new Set(storedLb.map((item) => item.id));
        const missingEntries = INITIAL_LEADERBOARD.filter((item) => !existingIds.has(item.id));
        this.leaderboard = [...storedLb, ...missingEntries];
      }
      const prof = localStorage.getItem('ultimatum_profiles');
      if (prof) this.profiles = JSON.parse(prof);
      const bm = localStorage.getItem('ultimatum_bookmarks');
      if (bm) this.bookmarks = JSON.parse(bm);
      const cur = localStorage.getItem('ultimatum_current_user');
      if (cur) {
        this.currentUser = JSON.parse(cur);
      }
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
    }
  }

  // --- AUTH & MERITS ---
  getCurrentUser(): Profile | null {
    return this.currentUser;
  }
  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }
  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  login(email: string, role: 'admin' | 'user' = 'user'): Profile {
    const existing = this.profiles.find(
      (p) => p.email?.toLowerCase() === email.toLowerCase() || p.username.toLowerCase() === email.toLowerCase()
    );
    if (existing) {
      this.currentUser = existing;
    } else {
      const newUser: Profile = {
        id: 'user-' + Date.now(),
        username: email.split('@')[0],
        email,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        role,
        points: 250,
        daily_streak: 1,
        badges: ['New Explorer'],
        created_at: new Date().toISOString(),
      };
      this.profiles.push(newUser);
      this.currentUser = newUser;
    }

    // Submit pending score if any
    if (this.pendingScore) {
      this.submitScore(this.pendingScore.gameId, this.pendingScore.score);
      this.pendingScore = null;
    }

    this.saveToLocalStorage();
    return this.currentUser;
  }

  logout() {
    this.currentUser = null;
    this.saveToLocalStorage();
  }

  switchUser(role: 'admin' | 'user') {
    if (role === 'admin') {
      this.currentUser = this.profiles.find((p) => p.role === 'admin') || this.profiles[0];
    } else {
      this.currentUser = this.profiles.find((p) => p.role === 'user') || this.profiles[1];
    }
    this.saveToLocalStorage();
  }

  setPendingScore(gameId: string, score: number) {
    this.pendingScore = { gameId, score };
  }

  awardReadingXP(slug: string): number {
    if (!this.currentUser) return 0;
    const bonus = 25;
    this.currentUser.points += bonus;
    const idx = this.profiles.findIndex((p) => p.id === this.currentUser?.id);
    if (idx >= 0) this.profiles[idx].points += bonus;
    this.saveToLocalStorage();
    return bonus;
  }

  // --- ARTICLES (Beauty, Fashion, News, Blogs) ---
  getArticles(category?: string): Article[] {
    if (category) {
      return this.articles.filter((a) => a.category === category);
    }
    return this.articles;
  }
  getArticleBySlug(slug: string): Article | undefined {
    return this.articles.find((a) => a.slug === slug);
  }
  saveArticle(article: Article): Article {
    const idx = this.articles.findIndex((a) => a.id === article.id);
    if (idx >= 0) {
      this.articles[idx] = article;
    } else {
      this.articles.unshift(article);
    }
    this.saveToLocalStorage();
    return article;
  }
  deleteArticle(id: string) {
    this.articles = this.articles.filter((a) => a.id !== id);
    this.saveToLocalStorage();
  }

  // --- BOOKMARKS & VAULT ---
  getBookmarks(): Bookmark[] {
    if (!this.currentUser) return [];
    return this.bookmarks.filter((b) => b.user_id === this.currentUser?.id);
  }
  isBookmarked(itemId: string): boolean {
    if (!this.currentUser) return false;
    return this.bookmarks.some((b) => b.user_id === this.currentUser?.id && b.item_id === itemId);
  }
  toggleBookmark(item: { type: 'recipe' | 'review' | 'article' | 'game'; id: string; title: string; slug: string }) {
    if (!this.currentUser) return false;
    const exists = this.bookmarks.find(
      (b) => b.user_id === this.currentUser?.id && b.item_id === item.id
    );
    if (exists) {
      this.bookmarks = this.bookmarks.filter((b) => b.id !== exists.id);
    } else {
      this.bookmarks.push({
        id: 'bm-' + Date.now(),
        user_id: this.currentUser.id,
        item_type: item.type,
        item_id: item.id,
        item_title: item.title,
        item_slug: item.slug,
        created_at: new Date().toISOString(),
      });
    }
    this.saveToLocalStorage();
    return !exists;
  }

  // --- GAMES ---
  getGames(): Game[] {
    return this.games;
  }
  getGameBySlug(slug: string): Game | undefined {
    return this.games.find((g) => g.slug === slug);
  }
  saveGame(game: Game): Game {
    const idx = this.games.findIndex((g) => g.id === game.id);
    if (idx >= 0) {
      this.games[idx] = game;
    } else {
      this.games.unshift(game);
    }
    this.saveToLocalStorage();
    return game;
  }
  deleteGame(id: string) {
    this.games = this.games.filter((g) => g.id !== id);
    this.saveToLocalStorage();
  }

  // --- RECIPES ---
  getRecipes(): Recipe[] {
    return this.recipes;
  }
  getRecipeBySlug(slug: string): Recipe | undefined {
    return this.recipes.find((r) => r.slug === slug);
  }
  saveRecipe(recipe: Recipe): Recipe {
    const idx = this.recipes.findIndex((r) => r.id === recipe.id);
    if (idx >= 0) {
      this.recipes[idx] = recipe;
    } else {
      this.recipes.unshift(recipe);
    }
    this.saveToLocalStorage();
    return recipe;
  }
  deleteRecipe(id: string) {
    this.recipes = this.recipes.filter((r) => r.id !== id);
    this.saveToLocalStorage();
  }

  // --- REVIEWS ---
  getReviews(): Review[] {
    return this.reviews;
  }
  getReviewBySlug(slug: string): Review | undefined {
    return this.reviews.find((r) => r.slug === slug);
  }
  saveReview(review: Review): Review {
    const idx = this.reviews.findIndex((r) => r.id === review.id);
    if (idx >= 0) {
      this.reviews[idx] = review;
    } else {
      this.reviews.unshift(review);
    }
    this.saveToLocalStorage();
    return review;
  }
  deleteReview(id: string) {
    this.reviews = this.reviews.filter((r) => r.id !== id);
    this.saveToLocalStorage();
  }

  // --- CUSTOM SUB-PAGES ---
  getPages(): CustomPage[] {
    return this.pages;
  }
  getPageBySlug(slug: string): CustomPage | undefined {
    return this.pages.find((p) => p.slug === slug);
  }
  savePage(page: CustomPage): CustomPage {
    const idx = this.pages.findIndex((p) => p.id === page.id);
    if (idx >= 0) {
      this.pages[idx] = page;
    } else {
      this.pages.unshift(page);
    }
    this.saveToLocalStorage();
    return page;
  }
  deletePage(id: string) {
    this.pages = this.pages.filter((p) => p.id !== id);
    this.saveToLocalStorage();
  }

  // --- LEADERBOARDS & SCORES ---
  getLeaderboard(gameId?: string): LeaderboardEntry[] {
    let list = this.leaderboard;
    if (gameId) {
      list = list.filter((e) => e.game_id === gameId);
    }
    return list.sort((a, b) => b.score - a.score);
  }

  async syncLeaderboardFromApi(gameId?: string): Promise<LeaderboardEntry[]> {
    if (typeof window === 'undefined') return this.getLeaderboard(gameId);
    try {
      const url = gameId ? `/api/leaderboards?game_id=${gameId}` : '/api/leaderboards';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const apiEntries: LeaderboardEntry[] = json.data.map((row: any, idx: number) => ({
            id: row.id,
            user_id: row.user_id,
            game_id: row.game_id,
            score: Number(row.score),
            player_name: row.player_name || row.profile?.username || 'Player',
            avatar_url: row.avatar_url || row.profile?.avatar_url,
            created_at: row.created_at || new Date().toISOString(),
            rank: row.rank || idx + 1,
            profile: {
              username: row.player_name || row.profile?.username || 'Player',
              avatar_url: row.avatar_url || row.profile?.avatar_url,
              badges: row.badges || row.profile?.badges || [],
            },
          }));

          // Merge with existing leaderboard (avoiding duplicates)
          const map = new Map<string, LeaderboardEntry>();
          apiEntries.forEach((e) => map.set(e.id, e));
          this.leaderboard.forEach((e) => {
            if (!map.has(e.id)) map.set(e.id, e);
          });
          this.leaderboard = Array.from(map.values()).sort((a, b) => b.score - a.score);
          this.saveToLocalStorage();
        }
      }
    } catch (e) {
      console.warn('Could not sync leaderboard with API:', e);
    }
    return this.getLeaderboard(gameId);
  }

  submitScore(gameId: string, score: number): LeaderboardEntry {
    const user = this.currentUser || this.profiles[0];
    const entry: LeaderboardEntry = {
      id: 'lb-' + Date.now(),
      user_id: user.id,
      game_id: gameId,
      score,
      player_name: user.username,
      avatar_url: user.avatar_url,
      week_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      profile: {
        username: user.username,
        avatar_url: user.avatar_url,
        badges: user.badges,
      },
    };

    this.leaderboard.push(entry);

    const game = this.games.find((g) => g.id === gameId);
    if (game) game.play_count += 1;

    const pointsAwarded = Math.floor(score / 100);
    if (this.currentUser) {
      this.currentUser.points += pointsAwarded;
      const profIndex = this.profiles.findIndex((p) => p.id === this.currentUser?.id);
      if (profIndex >= 0) this.profiles[profIndex].points += pointsAwarded;
    }

    this.saveToLocalStorage();

    // Asynchronously persist to backend MySQL / Supabase Database
    if (typeof window !== 'undefined') {
      fetch('/api/leaderboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: gameId,
          score,
          user_id: user.id,
          username: user.username,
        }),
      }).catch((err) => {
        console.warn('Async leaderboard API submission failed:', err);
      });
    }

    return entry;
  }
  deleteLeaderboardScore(id: string) {
    this.leaderboard = this.leaderboard.filter((e) => e.id !== id);
    this.saveToLocalStorage();
    if (typeof window !== 'undefined') {
      fetch(`/api/leaderboards?id=${id}`, { method: 'DELETE' }).catch(() => {});
    }
  }
  triggerWeeklyReset(): { resetCount: number; timestamp: string } {
    const count = this.leaderboard.length;
    this.leaderboard = [];
    this.saveToLocalStorage();
    if (typeof window !== 'undefined') {
      fetch('/api/leaderboards/reset', { method: 'POST' }).catch(() => {});
    }
    return { resetCount: count, timestamp: new Date().toISOString() };
  }

  // --- SPONSORS & ADS ---
  getSponsors(): Sponsor[] {
    return this.sponsors;
  }
  getSponsorBySlot(slot: string): Sponsor | undefined {
    return this.sponsors.find((s) => s.slot_position === slot && s.is_active);
  }
  saveSponsor(sponsor: Sponsor): Sponsor {
    const idx = this.sponsors.findIndex((s) => s.id === sponsor.id);
    if (idx >= 0) {
      this.sponsors[idx] = sponsor;
    } else {
      this.sponsors.unshift(sponsor);
    }
    this.saveToLocalStorage();
    return sponsor;
  }
  deleteSponsor(id: string) {
    this.sponsors = this.sponsors.filter((s) => s.id !== id);
    this.saveToLocalStorage();
  }
  trackImpression(sponsorId: string) {
    const sp = this.sponsors.find((s) => s.id === sponsorId);
    if (sp) {
      sp.impressions_tracked += 1;
      this.saveToLocalStorage();
    }
  }
  trackClick(sponsorId: string) {
    const sp = this.sponsors.find((s) => s.id === sponsorId);
    if (sp) {
      sp.clicks_tracked += 1;
      this.saveToLocalStorage();
    }
  }

  // --- USERS & PROFILES ---
  getProfiles(): Profile[] {
    return this.profiles;
  }
  updateUserProfile(id: string, updates: Partial<Profile>): Profile | undefined {
    const idx = this.profiles.findIndex((p) => p.id === id);
    if (idx >= 0) {
      this.profiles[idx] = { ...this.profiles[idx], ...updates };
      if (this.currentUser?.id === id) {
        this.currentUser = { ...this.currentUser, ...updates };
      }
      this.saveToLocalStorage();
      return this.profiles[idx];
    }
    return undefined;
  }
  deleteUser(id: string) {
    this.profiles = this.profiles.filter((p) => p.id !== id);
    this.leaderboard = this.leaderboard.filter((e) => e.user_id !== id);
    this.saveToLocalStorage();
  }

  // --- SITE SETTINGS ---
  getSettings(): SiteSettings {
    return this.settings;
  }
  updateSettings(newSettings: Partial<SiteSettings>): SiteSettings {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToLocalStorage();
    return this.settings;
  }

  // --- SCHEDULER HELPERS ---
  getScheduledPosts(): {
    recipes: Recipe[];
    reviews: Review[];
    articles: Article[];
  } {
    return {
      recipes: this.recipes.filter((r) => r.status === 'scheduled'),
      reviews: this.reviews.filter((r) => r.status === 'scheduled'),
      articles: this.articles.filter((a) => a.status === 'scheduled'),
    };
  }

  runLocalScheduler(): { publishedCount: number } {
    const now = Date.now();
    let count = 0;

    this.recipes.forEach((r) => {
      if (r.status === 'scheduled' && r.scheduled_for && new Date(r.scheduled_for).getTime() <= now) {
        r.status = 'published';
        r.published_at = new Date().toISOString();
        count++;
      }
    });

    this.reviews.forEach((rv) => {
      if (rv.status === 'scheduled' && rv.scheduled_for && new Date(rv.scheduled_for).getTime() <= now) {
        rv.status = 'published';
        rv.published_at = new Date().toISOString();
        count++;
      }
    });

    this.articles.forEach((a) => {
      if (a.status === 'scheduled' && a.scheduled_for && new Date(a.scheduled_for).getTime() <= now) {
        a.status = 'published';
        a.published_at = new Date().toISOString();
        count++;
      }
    });

    if (count > 0) {
      this.saveToLocalStorage();
    }

    return { publishedCount: count };
  }
}

export const platformStore = new PlatformStore();
