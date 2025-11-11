/**
 * PhD Repository - Repository Pattern
 * مسئول تمام عملیات database مربوط به PhD positions
 * 
 * Design Pattern: Repository Pattern
 * - جداسازی business logic از data access layer
 * - قابلیت تعویض database بدون تغییر business logic
 * - تست‌پذیری بالا (mock کردن آسان)
 */

const db = require('../connection');

class PhDRepository {
  /**
   * ذخیره یک PhD جدید
   */
  async insert(phdData) {
    const sql = `
      INSERT INTO phd_positions (
        external_id, url, title, description,
        university, location, country,
        discipline, subject, disciplines, subjects,
        department, supervisor, program_type,
        funding_type, funding_amount,
        deadline, deadline_date, start_date,
        description_script, title_script, university_script, json_ld_matched,
        is_active, first_seen_at, last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `;
    
    const params = [
      phdData.external_id,
      phdData.url,
      phdData.title || phdData.titleScript || null,
      phdData.description || null,
      phdData.university || phdData.universityScript || null,
      phdData.location || null,
      phdData.country || null,
      phdData.discipline || null,
      phdData.subject || null,
      phdData.disciplines ? JSON.stringify(phdData.disciplines) : null,
      phdData.subjects ? JSON.stringify(phdData.subjects) : null,
      phdData.department || null,
      phdData.supervisor || null,
      phdData.programType || null,
      phdData.funding_type || phdData.funding || null,
      phdData.funding_amount || null,
      phdData.deadline || phdData.deadlineText || null,
      phdData.deadlineDate || null,
      phdData.start_date || null,
      phdData.descriptionScript || null,
      phdData.titleScript || null,
      phdData.universityScript || null,
      phdData.jsonLdMatched ? 1 : 0
      // is_active = 1 (hardcoded in SQL)
    ];
    
    try {
      const result = await db.query(sql, params);
      return {
        success: true,
        id: result.lastInsertRowid
      };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        // PhD قبلاً وجود داشته
        return { success: false, reason: 'duplicate', external_id: phdData.external_id };
      }
      throw error;
    }
  }
  
  /**
   * آپدیت یک PhD موجود
   */
  async update(external_id, phdData) {
    const sql = `
      UPDATE phd_positions SET
        title = ?,
        description = ?,
        university = ?,
        location = ?,
        country = ?,
        discipline = ?,
        subject = ?,
        disciplines = ?,
        subjects = ?,
        department = ?,
        supervisor = ?,
        program_type = ?,
        funding_type = ?,
        funding_amount = ?,
        deadline = ?,
        deadline_date = ?,
        start_date = ?,
        description_script = ?,
        title_script = ?,
        university_script = ?,
        json_ld_matched = ?,
        last_seen_at = datetime('now'),
        last_updated_at = datetime('now'),
        updated_at = datetime('now'),
        is_active = 1
      WHERE external_id = ?
    `;
    
    const params = [
      phdData.title || phdData.titleScript || null,
      phdData.description || null,
      phdData.university || phdData.universityScript || null,
      phdData.location || null,
      phdData.country || null,
      phdData.discipline || null,
      phdData.subject || null,
      phdData.disciplines ? JSON.stringify(phdData.disciplines) : null,
      phdData.subjects ? JSON.stringify(phdData.subjects) : null,
      phdData.department || null,
      phdData.supervisor || null,
      phdData.programType || null,
      phdData.funding_type || phdData.funding || null,
      phdData.funding_amount || null,
      phdData.deadline || phdData.deadlineText || null,
      phdData.deadlineDate || null,
      phdData.start_date || null,
      phdData.descriptionScript || null,
      phdData.titleScript || null,
      phdData.universityScript || null,
      phdData.jsonLdMatched ? 1 : 0,
      external_id
    ];
    
    const result = await db.query(sql, params);
    return {
      success: result.changes > 0,
      changes: result.changes
    };
  }
  
  /**
   * Insert or Update (Upsert)
   */
  async upsert(phdData) {
    // ابتدا چک می‌کنیم که آیا وجود دارد
    const existing = await this.findByExternalId(phdData.external_id);
    
    if (existing) {
      // اگر وجود داره، update می‌کنیم
      await this.update(phdData.external_id, phdData);
      return { action: 'updated', external_id: phdData.external_id };
    } else {
      // اگر وجود نداره، insert می‌کنیم
      const insertResult = await this.insert(phdData);
      if (insertResult.success) {
        return { action: 'inserted', id: insertResult.id };
      } else {
        // اگر باز هم خطای duplicate داد (race condition)
        // یک بار دیگه update رو امتحان می‌کنیم
        await this.update(phdData.external_id, phdData);
        return { action: 'updated', external_id: phdData.external_id };
      }
    }
  }
  
  /**
   * پیدا کردن با external_id
   */
  async findByExternalId(external_id) {
    const sql = 'SELECT * FROM phd_positions WHERE external_id = ?';
    return await db.get(sql, [external_id]);
  }
  
  /**
   * پیدا کردن با ID
   */
  async findById(id) {
    const sql = 'SELECT * FROM phd_positions WHERE id = ?';
    return await db.get(sql, [id]);
  }
  
  /**
   * جستجو با فیلترها و pagination
   */
  async search(options = {}) {
    const {
      keywords = null,
      discipline = null,
      subject = null,
      country = null,
      university = null,
      funding_type = null,
      page = 1,
      limit = 20,
      sortBy = 'last_seen_at',
      sortOrder = 'DESC'
    } = options;
    
    // ساخت WHERE clause
    const whereClauses = ['is_active = 1', 'is_deleted = 0'];
    const params = [];
    
    if (keywords) {
      whereClauses.push('(title LIKE ? OR description LIKE ? OR university LIKE ?)');
      const keywordPattern = `%${keywords}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }
    
    if (discipline) {
      whereClauses.push('discipline = ?');
      params.push(discipline);
    }
    
    if (subject) {
      whereClauses.push('subject = ?');
      params.push(subject);
    }
    
    if (country) {
      whereClauses.push('country = ?');
      params.push(country);
    }
    
    if (university) {
      whereClauses.push('university LIKE ?');
      params.push(`%${university}%`);
    }
    
    if (funding_type) {
      whereClauses.push('funding_type = ?');
      params.push(funding_type);
    }
    
    const whereClause = whereClauses.join(' AND ');
    
    // محاسبه offset برای pagination
    const offset = (page - 1) * limit;
    
    // گرفتن total count
    const countSql = `SELECT COUNT(*) as total FROM phd_positions WHERE ${whereClause}`;
    const countResult = await db.get(countSql, params);
    const total = countResult.total;
    
    // گرفتن results
    const dataSql = `
      SELECT * FROM phd_positions 
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const results = await db.query(dataSql, [...params, limit, offset]);
    
    return {
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }
  
  /**
   * دریافت تمام PhD های فعال (بدون pagination - برای crawler)
   */
  async getAllActive() {
    const sql = `
      SELECT external_id, last_seen_at 
      FROM phd_positions 
      WHERE is_active = 1 AND is_deleted = 0
    `;
    return await db.query(sql);
  }
  
  /**
   * علامت‌گذاری PhD به عنوان حذف شده
   */
  async markAsDeleted(external_ids) {
    if (!Array.isArray(external_ids) || external_ids.length === 0) {
      return { success: false, message: 'No IDs provided' };
    }
    
    const placeholders = external_ids.map(() => '?').join(',');
    const sql = `
      UPDATE phd_positions 
      SET is_active = 0, is_deleted = 1, updated_at = datetime('now')
      WHERE external_id IN (${placeholders})
    `;
    
    const result = await db.query(sql, external_ids);
    return {
      success: true,
      deleted: result.changes
    };
  }
  
  /**
   * آپدیت last_seen_at برای PhD های موجود
   */
  async updateLastSeen(external_ids) {
    if (!Array.isArray(external_ids) || external_ids.length === 0) {
      return { success: false };
    }
    
    const placeholders = external_ids.map(() => '?').join(',');
    const sql = `
      UPDATE phd_positions 
      SET last_seen_at = datetime('now')
      WHERE external_id IN (${placeholders})
    `;
    
    const result = await db.query(sql, external_ids);
    return { success: true, updated: result.changes };
  }
  
  /**
   * دریافت آمار کلی
   */
  async getStats() {
    const stats = {};
    
    // تعداد کل
    const total = await db.get('SELECT COUNT(*) as count FROM phd_positions');
    stats.total = total.count;
    
    // تعداد فعال
    const active = await db.get(
      'SELECT COUNT(*) as count FROM phd_positions WHERE is_active = 1 AND is_deleted = 0'
    );
    stats.active = active.count;
    
    // تعداد حذف شده
    const deleted = await db.get(
      'SELECT COUNT(*) as count FROM phd_positions WHERE is_deleted = 1'
    );
    stats.deleted = deleted.count;
    
    // تعداد به تفکیک کشور
    const byCountry = await db.query(`
      SELECT country, COUNT(*) as count 
      FROM phd_positions 
      WHERE is_active = 1 AND is_deleted = 0 AND country IS NOT NULL
      GROUP BY country 
      ORDER BY count DESC 
      LIMIT 10
    `);
    stats.byCountry = byCountry;
    
    // تعداد به تفکیک discipline
    const byDiscipline = await db.query(`
      SELECT discipline, COUNT(*) as count 
      FROM phd_positions 
      WHERE is_active = 1 AND is_deleted = 0 AND discipline IS NOT NULL
      GROUP BY discipline 
      ORDER BY count DESC 
      LIMIT 10
    `);
    stats.byDiscipline = byDiscipline;
    
    // تعداد به تفکیک funding
    const byFunding = await db.query(`
      SELECT funding_type, COUNT(*) as count 
      FROM phd_positions 
      WHERE is_active = 1 AND is_deleted = 0 AND funding_type IS NOT NULL
      GROUP BY funding_type 
      ORDER BY count DESC
    `);
    stats.byFunding = byFunding;
    
    // آخرین PhD های اضافه شده
    const latest = await db.query(`
      SELECT id, external_id, title, university, country, first_seen_at
      FROM phd_positions 
      WHERE is_active = 1 AND is_deleted = 0
      ORDER BY first_seen_at DESC 
      LIMIT 10
    `);
    stats.latest = latest;
    
    return stats;
  }
  
  /**
   * حذف تمام داده‌ها (فقط برای تست)
   */
  async truncate() {
    await db.query('DELETE FROM phd_positions');
    return { success: true };
  }
}

module.exports = new PhDRepository();

