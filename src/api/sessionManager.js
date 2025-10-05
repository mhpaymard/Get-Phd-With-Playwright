// Session Manager - مدیریت session های کاربران و ذخیره state
const { v4: uuidv4 } = require('uuid');

class SessionManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> session data
    this.userSessions = new Map(); // userId -> [sessionIds]
  }

  // ایجاد session جدید
  createSession(userId) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      searches: [], // تاریخچه جستجوها
      currentSearch: null, // جستجوی فعال
      state: {} // state اضافی
    };

    this.sessions.set(sessionId, session);
    
    // اضافه کردن به لیست session های کاربر
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, []);
    }
    this.userSessions.get(userId).push(sessionId);

    console.log(`[SessionManager] Session created: ${sessionId} for user ${userId}`);
    return session;
  }

  // دریافت session
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      session.lastAccessedAt = Date.now();
      return session;
    }
    
    return null;
  }

  // به‌روزرسانی session
  updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    Object.assign(session, updates);
    session.lastAccessedAt = Date.now();
    
    return session;
  }

  // ذخیره وضعیت جستجو
  saveSearchState(sessionId, searchData) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    const searchState = {
      id: uuidv4(),
      sessionId,
      query: searchData.query,
      filters: searchData.filters,
      currentPage: searchData.page || 1,
      totalPages: searchData.totalPages || null,
      results: searchData.results || [],
      status: searchData.status || 'pending', // pending, in-progress, completed, error
      createdAt: Date.now(),
      updatedAt: Date.now(),
      error: null
    };

    session.searches.push(searchState);
    session.currentSearch = searchState;
    session.lastAccessedAt = Date.now();

    console.log(`[SessionManager] Search state saved: ${searchState.id} for session ${sessionId}`);
    return searchState;
  }

  // ادامه جستجو (بدون نیاز به نگه داشتن تب)
  resumeSearch(sessionId, searchId) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    const search = session.searches.find(s => s.id === searchId);
    
    if (!search) {
      throw new Error('Search not found');
    }

    session.currentSearch = search;
    session.lastAccessedAt = Date.now();

    console.log(`[SessionManager] Search resumed: ${searchId} for session ${sessionId}`);
    return search;
  }

  // به‌روزرسانی وضعیت جستجو
  updateSearchState(sessionId, searchId, updates) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    const search = session.searches.find(s => s.id === searchId);
    
    if (!search) {
      throw new Error('Search not found');
    }

    Object.assign(search, updates);
    search.updatedAt = Date.now();
    session.lastAccessedAt = Date.now();

    return search;
  }

  // دریافت تمام جستجوهای یک session
  getSearchHistory(sessionId) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    return session.searches;
  }

  // حذف session
  deleteSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      // حذف از لیست session های کاربر
      const userSessionList = this.userSessions.get(session.userId);
      if (userSessionList) {
        const index = userSessionList.indexOf(sessionId);
        if (index !== -1) {
          userSessionList.splice(index, 1);
        }
        
        if (userSessionList.length === 0) {
          this.userSessions.delete(session.userId);
        }
      }
      
      this.sessions.delete(sessionId);
      console.log(`[SessionManager] Session deleted: ${sessionId}`);
      return true;
    }
    
    return false;
  }

  // دریافت تمام session های یک کاربر
  getUserSessions(userId) {
    const sessionIds = this.userSessions.get(userId) || [];
    return sessionIds.map(id => this.sessions.get(id)).filter(Boolean);
  }

  // پاکسازی session های قدیمی (بعد از 24 ساعت)
  async cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    let deletedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastAccessedAt > maxAge) {
        this.deleteSession(sessionId);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`[SessionManager] Cleaned up ${deletedCount} expired sessions`);
    }
  }

  // آمار
  getStats() {
    return {
      totalSessions: this.sessions.size,
      totalUsers: this.userSessions.size,
      activeSessions: Array.from(this.sessions.values()).filter(
        s => Date.now() - s.lastAccessedAt < 60 * 60 * 1000 // active in last hour
      ).length
    };
  }
}

// Singleton instance
const sessionManager = new SessionManager();

// پاکسازی دوره‌ای
setInterval(() => {
  sessionManager.cleanup().catch(console.error);
}, 60 * 60 * 1000); // هر 1 ساعت

module.exports = sessionManager;
