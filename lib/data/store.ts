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
  INITIAL_COMMENTS,
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
  Comment,
  PostStatus,
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
  private comments: Comment[] = [...INITIAL_COMMENTS];
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
      localStorage.setItem('ultimatum_comments', JSON.stringify(this.comments));
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
        const combined = [...storedLb, ...INITIAL_LEADERBOARD];
        const deduplicatedMap = new Map<string, LeaderboardEntry>();
        for (const item of combined) {
          const uKey = item.user_id || item.player_name || item.profile?.username || 'player';
          const gKey = item.game_id;
          const key = `${uKey}_${gKey}`;
          const existing = deduplicatedMap.get(key);
          if (!existing || item.score > existing.score) {
            deduplicatedMap.set(key, item);
          }
        }
        this.leaderboard = Array.from(deduplicatedMap.values()).sort((a, b) => b.score - a.score);
      }
      const prof = localStorage.getItem('ultimatum_profiles');
      if (prof) this.profiles = JSON.parse(prof);
      const cur = localStorage.getItem('ultimatum_current_user');
      if (cur) {
        this.currentUser = JSON.parse(cur);
      }
      const c = localStorage.getItem('ultimatum_comments');
      if (c) {
        const storedComments: Comment[] = JSON.parse(c);
        const existingIds = new Set(storedComments.map((item) => String(item.id)));
        const missingComments = INITIAL_COMMENTS.filter((item) => !existingIds.has(String(item.id)));
        this.comments = [...storedComments, ...missingComments];
      }
      this.autoPublishScheduled();
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

  awardReadingXP(_slug?: string): number {
    if (!this.currentUser) return 0;
    const bonus = 25;
    this.currentUser.points += bonus;
    const idx = this.profiles.findIndex((p) => p.id === this.currentUser?.id);
    if (idx >= 0) this.profiles[idx].points += bonus;
    this.saveToLocalStorage();
    return bonus;
  }

  awardPoints(userId: string, points: number): number {
    const profile = this.profiles.find((p) => p.id === userId);
    if (profile) {
      profile.points = (profile.points || 0) + points;
    }
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser.points = (this.currentUser.points || 0) + points;
    }
    this.saveToLocalStorage();
    return points;
  }

  // --- ARTICLES (Beauty, Fashion, News, Blogs) ---
  getAllArticles(): Article[] {
    this.autoPublishScheduled();
    return this.articles;
  }
  getArticles(category?: string, status?: PostStatus | 'all'): Article[] {
    this.autoPublishScheduled();
    let list = this.articles;
    if (category) {
      list = list.filter((a) => a.category === category);
    }
    if (status === 'all') {
      return list;
    }
    if (status) {
      return list.filter((a) => (a.status || 'published') === status);
    }
    return list.filter((a) => (a.status || 'published') === 'published');
  }
  getArticleBySlug(slug: string, allowUnpublished: boolean = false): Article | undefined {
    this.autoPublishScheduled();
    const art = this.articles.find((a) => a.slug === slug);
    if (!art) return undefined;
    if (allowUnpublished || this.isAdmin()) return art;
    if (art.status === 'draft') return undefined;
    if (art.status === 'scheduled' && art.scheduled_for && new Date(art.scheduled_for).getTime() > Date.now()) {
      return undefined;
    }
    return art;
  }
  saveArticle(article: Article): Article {
    if (article.status === 'scheduled' && article.scheduled_for) {
      if (new Date(article.scheduled_for).getTime() <= Date.now()) {
        article.status = 'published';
        article.published_at = article.published_at || new Date().toISOString();
      }
    }
    const idx = this.articles.findIndex((a) => a.id === article.id || (article.slug && a.slug === article.slug));
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
  getAllRecipes(): Recipe[] {
    this.autoPublishScheduled();
    return this.recipes;
  }
  getRecipes(status?: PostStatus | 'all'): Recipe[] {
    this.autoPublishScheduled();
    if (status === 'all') return this.recipes;
    if (status) return this.recipes.filter((r) => (r.status || 'published') === status);
    return this.recipes.filter((r) => (r.status || 'published') === 'published');
  }
  getRecipeBySlug(slug: string, allowUnpublished: boolean = false): Recipe | undefined {
    this.autoPublishScheduled();
    const rec = this.recipes.find((r) => r.slug === slug);
    if (!rec) return undefined;
    if (allowUnpublished || this.isAdmin()) return rec;
    if (rec.status === 'draft') return undefined;
    if (rec.status === 'scheduled' && rec.scheduled_for && new Date(rec.scheduled_for).getTime() > Date.now()) {
      return undefined;
    }
    return rec;
  }
  saveRecipe(recipe: Recipe): Recipe {
    if (recipe.status === 'scheduled' && recipe.scheduled_for) {
      if (new Date(recipe.scheduled_for).getTime() <= Date.now()) {
        recipe.status = 'published';
        recipe.published_at = recipe.published_at || new Date().toISOString();
      }
    }
    const idx = this.recipes.findIndex((r) => r.id === recipe.id || (recipe.slug && r.slug === recipe.slug));
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
  getAllReviews(): Review[] {
    this.autoPublishScheduled();
    return this.reviews;
  }
  getReviews(category?: string, status?: PostStatus | 'all'): Review[] {
    this.autoPublishScheduled();
    let list = this.reviews;
    if (category) {
      list = list.filter((r) => r.category === category);
    }
    if (status === 'all') return list;
    if (status) return list.filter((r) => (r.status || 'published') === status);
    return list.filter((r) => (r.status || 'published') === 'published');
  }
  getReviewBySlug(slug: string, allowUnpublished: boolean = false): Review | undefined {
    this.autoPublishScheduled();
    const rev = this.reviews.find((r) => r.slug === slug);
    if (!rev) return undefined;
    if (allowUnpublished || this.isAdmin()) return rev;
    if (rev.status === 'draft') return undefined;
    if (rev.status === 'scheduled' && rev.scheduled_for && new Date(rev.scheduled_for).getTime() > Date.now()) {
      return undefined;
    }
    return rev;
  }
  saveReview(review: Review): Review {
    if (review.status === 'scheduled' && review.scheduled_for) {
      if (new Date(review.scheduled_for).getTime() <= Date.now()) {
        review.status = 'published';
        review.published_at = review.published_at || new Date().toISOString();
      }
    }
    const idx = this.reviews.findIndex((r) => r.id === review.id || (review.slug && r.slug === review.slug));
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
      const game = this.games.find((g) => g.id === gameId || g.slug === gameId);
      const targetId = game ? game.id : gameId;
      const targetSlug = game ? game.slug : gameId;
      list = list.filter((e) => e.game_id === targetId || e.game_id === targetSlug);
    }

    // STRICT GUARANTEE: Exactly 1 entry per player/user, preserving highest score
    const bestUserScores = new Map<string, LeaderboardEntry>();
    for (const entry of list) {
      const userKey = entry.user_id || entry.player_name || entry.profile?.username || 'player';
      const existing = bestUserScores.get(userKey);
      if (!existing || entry.score > existing.score) {
        bestUserScores.set(userKey, entry);
      }
    }

    return Array.from(bestUserScores.values())
      .sort((a, b) => b.score - a.score)
      .map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }));
  }

  async syncLeaderboardFromApi(gameId?: string): Promise<LeaderboardEntry[]> {
    if (typeof window === 'undefined') return this.getLeaderboard(gameId);
    try {
      const game = this.games.find((g) => g.id === gameId || g.slug === gameId);
      const targetId = game ? game.id : gameId;
      const url = targetId ? `/api/leaderboards?game_id=${targetId}` : '/api/leaderboards';
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

          // Merge API entries with existing in-memory leaderboard by (user, game)
          const mergedMap = new Map<string, LeaderboardEntry>();
          for (const e of this.leaderboard) {
            const uKey = e.user_id || e.player_name || e.profile?.username || 'player';
            const gKey = e.game_id;
            mergedMap.set(`${uKey}_${gKey}`, e);
          }
          for (const e of apiEntries) {
            const uKey = e.user_id || e.player_name || e.profile?.username || 'player';
            const gKey = e.game_id;
            const existing = mergedMap.get(`${uKey}_${gKey}`);
            if (!existing || e.score > existing.score) {
              mergedMap.set(`${uKey}_${gKey}`, e);
            }
          }

          this.leaderboard = Array.from(mergedMap.values()).sort((a, b) => b.score - a.score);
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
    const game = this.games.find((g) => g.id === gameId || g.slug === gameId);
    const targetGameId = game ? game.id : gameId;
    const targetGameSlug = game ? game.slug : gameId;

    // Find existing entry for this user and game (checking both id and slug)
    const existingIndex = this.leaderboard.findIndex(
      (e) => (e.user_id === user.id || e.player_name === user.username) &&
             (e.game_id === targetGameId || e.game_id === targetGameSlug)
    );

    let entry: LeaderboardEntry;

    if (existingIndex >= 0) {
      const existing = this.leaderboard[existingIndex];
      // Only overwrite if new score is strictly greater (preserve high score)
      if (score > existing.score) {
        existing.score = score;
        existing.game_id = targetGameId;
        existing.week_timestamp = new Date().toISOString();
        existing.player_name = user.username;
        existing.avatar_url = user.avatar_url;
        existing.profile = {
          username: user.username,
          avatar_url: user.avatar_url,
          badges: user.badges,
        };
      }
      entry = existing;
    } else {
      entry = {
        id: 'lb-' + Date.now(),
        user_id: user.id,
        game_id: targetGameId,
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
    }

    // Clean up any other duplicate entries for this user and game
    this.leaderboard = this.leaderboard.filter(
      (e) =>
        e.id === entry.id ||
        !(
          (e.user_id === user.id || e.player_name === user.username) &&
          (e.game_id === targetGameId || e.game_id === targetGameSlug)
        )
    );

    // Sort leaderboard by score descending
    this.leaderboard.sort((a, b) => b.score - a.score);

    // Calculate current rank
    const gameEntries = this.getLeaderboard(targetGameId);
    entry.rank = gameEntries.findIndex((e) => e.user_id === user.id || e.player_name === user.username) + 1;

    if (game) game.play_count += 1;

    const pointsAwarded = Math.floor(score / 100);
    if (this.currentUser) {
      this.currentUser.points += pointsAwarded;
      const profIndex = this.profiles.findIndex((p) => p.id === this.currentUser?.id);
      if (profIndex >= 0) this.profiles[profIndex].points += pointsAwarded;
    }

    this.saveToLocalStorage();

    // Dispatch global event for instant UI re-render
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('leaderboard-updated', { detail: { gameId: targetGameId, score } }));
      window.dispatchEvent(new CustomEvent('balance-updated', { detail: { coinsEarned: pointsAwarded } }));

      // Asynchronously persist to backend SQL Server Database
      fetch('/api/leaderboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: targetGameId,
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
      this.profiles[idx] = { ...this.profiles[idx], ...updates, updated_at: new Date().toISOString() };
      if (this.currentUser?.id === id) {
        this.currentUser = this.profiles[idx];
      }
      this.saveToLocalStorage();
      return this.profiles[idx];
    }
    return undefined;
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

  // --- COMMENTS & COMMUNITY ---
  getComments(contentIdOrSlug?: string, contentType?: string, userId?: string): Comment[] {
    let list = [...this.comments];
    if (userId) {
      list = list.filter((c) => String(c.user_id) === String(userId));
    }
    if (contentType) {
      list = list.filter((c) => c.content_type === contentType);
    }
    if (contentIdOrSlug) {
      list = list.filter(
        (c) =>
          String(c.content_id) === String(contentIdOrSlug) ||
          c.content_slug === contentIdOrSlug
      );
    }
    return list
      .map((c) => {
        const prof = this.profiles.find((p) => String(p.id) === String(c.user_id));
        return {
          ...c,
          username: c.username || prof?.username || 'Community Member',
          avatar_url: c.avatar_url || prof?.avatar_url,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  addComment(commentData: {
    user_id?: string;
    content_type?: string;
    content_id: string;
    content_slug?: string;
    body: string;
    username?: string;
    avatar_url?: string;
  }): Comment {
    const user = this.currentUser || this.profiles[0];
    const newComment: Comment = {
      id: Date.now(),
      user_id: commentData.user_id || user.id,
      content_type: commentData.content_type || 'article',
      content_id: String(commentData.content_id),
      content_slug: commentData.content_slug || String(commentData.content_id),
      body: commentData.body.trim(),
      username: commentData.username || user.username || 'User',
      avatar_url: commentData.avatar_url || user.avatar_url,
      created_at: new Date().toISOString(),
    };

    this.comments.unshift(newComment);
    this.saveToLocalStorage();
    return newComment;
  }

  deleteComment(id: number | string, userId?: string): boolean {
    const numericId = Number(id);
    const prevCount = this.comments.length;
    this.comments = this.comments.filter((c) => {
      if (c.id === numericId || String(c.id) === String(id)) {
        if (userId && String(c.user_id) !== String(userId) && !this.isAdmin()) {
          return true;
        }
        return false;
      }
      return true;
    });

    const deleted = this.comments.length < prevCount;
    if (deleted) {
      this.saveToLocalStorage();
    }
    return deleted;
  }

  // --- SCHEDULER HELPERS ---
  autoPublishScheduled(): number {
    const now = Date.now();
    let count = 0;
    let changed = false;

    this.recipes.forEach((r) => {
      if (r.status === 'scheduled' && r.scheduled_for) {
        const t = new Date(r.scheduled_for).getTime();
        if (!isNaN(t) && t <= now) {
          r.status = 'published';
          r.published_at = r.published_at || new Date().toISOString();
          count++;
          changed = true;
        }
      }
    });

    this.reviews.forEach((rv) => {
      if (rv.status === 'scheduled' && rv.scheduled_for) {
        const t = new Date(rv.scheduled_for).getTime();
        if (!isNaN(t) && t <= now) {
          rv.status = 'published';
          rv.published_at = rv.published_at || new Date().toISOString();
          count++;
          changed = true;
        }
      }
    });

    this.articles.forEach((a) => {
      if (a.status === 'scheduled' && a.scheduled_for) {
        const t = new Date(a.scheduled_for).getTime();
        if (!isNaN(t) && t <= now) {
          a.status = 'published';
          a.published_at = a.published_at || new Date().toISOString();
          count++;
          changed = true;
        }
      }
    });

    if (changed) {
      this.saveToLocalStorage();
    }
    return count;
  }

  getScheduledPosts(): {
    recipes: Recipe[];
    reviews: Review[];
    articles: Article[];
  } {
    this.autoPublishScheduled();
    return {
      recipes: this.recipes.filter((r) => r.status === 'scheduled'),
      reviews: this.reviews.filter((r) => r.status === 'scheduled'),
      articles: this.articles.filter((a) => a.status === 'scheduled'),
    };
  }

  runLocalScheduler(): { publishedCount: number } {
    const count = this.autoPublishScheduled();
    return { publishedCount: count };
  }
}

export const platformStore = new PlatformStore();

