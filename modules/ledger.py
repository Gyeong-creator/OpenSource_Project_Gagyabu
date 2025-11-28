import pymysql
from .user import db_connector 
from datetime import timedelta, date

# ---------------------------------------------------------
# [수정] 모든 함수에서 cursor() 대신 cursor(pymysql.cursors.DictCursor) 사용
# ---------------------------------------------------------

def select_ledger_by_user(user_id):
    """ 가계부 메인 목록 조회 """
    db = None
    cursor = None
    try:
        db = db_connector()
        # [수정] 딕셔너리 커서 사용
        cursor = db.cursor(pymysql.cursors.DictCursor) 
    
        sql = """
            SELECT id, user_id, date, type, description, amount, category, pay
            FROM ledger 
            WHERE user_id = %s 
            ORDER BY date DESC
        """
        cursor.execute(sql, (user_id,))
        results = cursor.fetchall()
        return results

    except Exception as e:
        print(f"[SELECT LEDGER ERROR] {e}")
        return []

    finally:
        if cursor: cursor.close()
        if db: db.close()

# --- 통계 함수 ---

def select_month_ledger_by_user(user_id, year, month, days, start, end):
    """ (월간 합계) 일별 누적 지출 """
    db = None
    cur = None
    try:
        db = db_connector()
        cur = db.cursor(pymysql.cursors.DictCursor) # [수정]

        sql = """
            SELECT DATE(date) AS d,
                   SUM(CASE WHEN type='출금' THEN amount ELSE 0 END) AS spend
            FROM ledger
            WHERE user_id = %s AND date >= %s AND date < %s
            GROUP BY DATE(date)
            ORDER BY d
        """
        cur.execute(sql, (user_id, start, end))
        rows = cur.fetchall()
        by_day = {r['d']: int(r['spend'] or 0) for r in rows}

        labels = [f"{i}일" for i in range(1, days + 1)]
        cumulative = []
        running = 0
        for day in range(1, days + 1):
            d = date(year, month, day)
            running += by_day.get(d, 0)
            cumulative.append(running)

        return {'labels': labels, 'thisMonth': cumulative}
    finally:
        if cur: cur.close()
        if db: db.close()


def select_month_daily_spend_income(user_id, start, end, year, month, days):
    """ 
    (통계 상세) 수입/지출 및 결제수단(pay)별 통계 
    """
    db = None
    cur = None
    try:
        db = db_connector()
        cur = db.cursor(pymysql.cursors.DictCursor) # [수정]

        sql = """
            SELECT DATE(date) AS d,
                   SUM(CASE WHEN type = '입금'  THEN amount ELSE 0 END) AS income,
                   SUM(CASE WHEN type = '출금'  THEN amount ELSE 0 END) AS spend,
                   SUM(CASE WHEN type='출금' AND pay='카드'        THEN amount ELSE 0 END) AS card,
                   SUM(CASE WHEN type='출금' AND pay='계좌이체'  THEN amount ELSE 0 END) AS transfer,
                   SUM(CASE WHEN type='출금' AND pay NOT IN ('카드','계좌이체') THEN amount ELSE 0 END) AS other
            FROM ledger
            WHERE user_id = %s AND date >= %s AND date < %s
            GROUP BY DATE(date)
            ORDER BY d
        """
        cur.execute(sql, (user_id, start, end))
        rows = cur.fetchall()

        # [수정]
        income_by_day   = {}
        spend_by_day    = {}
        card_by_day     = {}
        transfer_by_day = {}
        other_by_day    = {}
        for r in rows:
            d = r['d']
            income_by_day[d]   = int(r['income']   or 0)
            spend_by_day[d]    = int(r['spend']    or 0)
            card_by_day[d]     = int(r['card']     or 0)
            transfer_by_day[d] = int(r['transfer'] or 0)
            other_by_day[d]    = int(r['other']    or 0)

        labels       = [f"{i}일" for i in range(1, days+1)]
        cumIncome    = []
        cumSpend     = []
        cumCard      = []
        cumTransfer  = []
        cumOther     = []

        run_inc = run_spd = run_card = run_tr = run_oth = 0
        for day in range(1, days+1):
            d = date(year, month, day)
            run_inc += income_by_day.get(d, 0)
            run_spd += spend_by_day.get(d, 0)
            run_card += card_by_day.get(d, 0)
            run_tr   += transfer_by_day.get(d, 0)
            run_oth  += other_by_day.get(d, 0)

            cumIncome.append(run_inc)
            cumSpend.append(run_spd)
            cumCard.append(run_card)
            cumTransfer.append(run_tr)
            cumOther.append(run_oth)

        return {
            'labels': labels,
            'cumIncome':   cumIncome,
            'cumSpend':    cumSpend,
            'cumCard':     cumCard,
            'cumTransfer': cumTransfer,
            'cumOther':    cumOther,
            'totalIncome': run_inc,
            'totalSpend':  run_spd,
            'totalCard': run_card,
            'totalTransfer': run_tr,
            'totalOther':  run_oth,
        }
    except Exception as e:
        print(f"[STATS DETAIL ERROR] {e}") # 에러 로그 확인용
        return {}
    finally:
        if cur: cur.close()
        if db: db.close()


def select_month_category_spend(user_id, start, end):
    """ (카테고리 통계) """
    db = None
    cur = None
    try:
        db = db_connector()
        cur = db.cursor(pymysql.cursors.DictCursor) # [수정]

        sql = """
            SELECT
              COALESCE(NULLIF(TRIM(category), ''), '기타') AS cat,
              SUM(
                CASE
                  WHEN TRIM(LOWER(type)) <> '입금'
                  THEN CAST(REPLACE(amount, ',', '') AS SIGNED)
                  ELSE 0
                END
              ) AS spend
            FROM ledger
            WHERE user_id = %s
              AND date >= %s AND date < %s
            GROUP BY cat
            HAVING spend > 0
            ORDER BY spend DESC
        """
        cur.execute(sql, (user_id, start, end))
        rows = cur.fetchall()

        total = sum(int(r['spend'] or 0) for r in rows) or 0
        items = []
        for r in rows:
            amt = int(r['spend'] or 0)
            pct = (amt / total * 100.0) if total > 0 else 0.0
            items.append({
                'category': r['cat'],
                'amount': amt,
                'pct': round(pct, 1)
            })

        return { 'total': total, 'items': items }
    finally:
        if cur: cur.close()
        if db: db.close()


def select_recent_weeks(user_id, n_weeks):
    """ (주간 통계) """
    db = cur = None
    try:
        db = db_connector()
        cur = db.cursor(pymysql.cursors.DictCursor) # [수정]

        sql = """
        WITH RECURSIVE seq(i) AS (
            SELECT 0 UNION ALL SELECT i + 1 FROM seq WHERE i + 1 < %s
        ),
        base AS (
            SELECT DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AS monday_this_week
        ),
        weeks AS (
            SELECT DATE_SUB(b.monday_this_week, INTERVAL s.i WEEK) AS week_start
            FROM base b JOIN seq s
        ),
        agg AS (
            SELECT
                w.week_start,
                COALESCE(SUM(CASE WHEN l.type='입금' THEN l.amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN l.type='출금' THEN l.amount ELSE 0 END), 0) AS spend
            FROM weeks w
            LEFT JOIN ledger l
              ON l.user_id = %s
             AND l.date >= w.week_start
             AND l.date <  DATE_ADD(w.week_start, INTERVAL 7 DAY)
            GROUP BY w.week_start
        )
        SELECT
            DATE_FORMAT(week_start, '%%m.%%d') AS start_label,
            DATE_FORMAT(DATE_ADD(week_start, INTERVAL 6 DAY), '%%m.%%d') AS end_label,
            (income - spend) AS net
        FROM agg
        ORDER BY week_start
        """
        cur.execute(sql, (n_weeks, user_id))
        rows = cur.fetchall()

        labels = [f"{r['start_label']}~{r['end_label']}" for r in rows]
        net    = [int(r['net'] or 0) for r in rows]
        return {"labels": labels, "net": net}

    except Exception as e:
        print(f"[STATS WEEKLY ERROR] {e}")
        return {"labels": [], "net": []}
    finally:
        if cur: cur.close()
        if db: db.close()


# --- CRUD 함수 ---
# INSERT, UPDATE, DELETE는 결과를 받아오는 게 아니라서 DictCursor가 필수는 아니지만,
# 일관성을 위해 둬도 상관없고, 에러 발생 시 롤백 로직이 중요합니다.

def insert_transaction(user_id, date, type, desc, amount, category=None):
    db = None
    cursor = None
    try:
        db = db_connector()
        cursor = db.cursor()
        # [주의] pay 컬럼이 있다면 INSERT 할 때도 pay 값을 넣어줘야 완벽합니다.
        # 일단은 기존 코드(pay 없음)를 유지하되, DB 기본값(Default)이나 NULL로 들어가게 둡니다.
        sql = """
            INSERT INTO ledger (user_id, date, type, description, amount, category, pay)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        # (DB 컬럼명이 'description'이므로, 'desc' 변수를 description 컬럼에 삽입)
        
        # (!!! 수정 !!!) 'type' 변수명 충돌을 피하기 위해 'transaction_type'으로 변경
        cursor.execute(sql, (user_id, date, transaction_type, desc, amount, category, pay))
        db.commit()
    except Exception as e:
        if db: db.rollback()
        raise e
    finally:
        if cursor: cursor.close()
        if db: db.close()

def delete_transaction_by_id(transaction_id, user_id):
    db = None
    cursor = None
    try:
        db = db_connector()
        cursor = db.cursor()
        sql = "DELETE FROM ledger WHERE id = %s AND user_id = %s"
        cursor.execute(sql, (transaction_id, user_id))
        db.commit()
    except Exception as e:
        if db: db.rollback()
        raise e
    finally:
        if cursor: cursor.close()
        if db: db.close()

def update_transaction(trans_id, user_id, date, type, desc, amount, category, pay):
    """ (신규) ID와 일치하는 거래 내역을 수정합니다. """
    db = None
    cursor = None
    try:
        db = db_connector()
        cursor = db.cursor()
        sql = """
            UPDATE ledger 
            SET 
                date = %s, 
                type = %s, 
                description = %s,
                amount = %s,
                category = %s,
                pay = %s
            WHERE 
                id = %s AND user_id = %s
        """
        
        # (참고) insert와 순서가 다름 (id, user_id가 WHERE절로 감)
        affected_rows = cursor.execute(sql, (date, type, desc, amount,category, pay, trans_id, user_id))
        db.commit()
    except Exception as e:
        if db: db.rollback()
        raise e
    finally:
        if cursor: cursor.close()
        if db: db.close()

def select_transactions_by_date(user_id, date):
    db = None
    cursor = None
    try:
        db = db_connector() # 기존 DB 연결 함수
        
        # 결과를 딕셔너리로 받기 위해 DictCursor 사용
        cursor = db.cursor(pymysql.cursors.DictCursor) 
        
        sql = """
            SELECT id, user_id, date, type, description, amount, category, pay 
            FROM ledger 
            WHERE user_id = %s AND date = %s
            ORDER BY id ASC
        """
        
        # pay 컬럼도 같이 조회
        sql = "SELECT * FROM ledger WHERE user_id=%s AND date=%s ORDER BY id ASC"
        cursor.execute(sql, (user_id, date))
        return cursor.fetchall()
    except Exception as e:
        print(f"[SELECT BY DATE ERROR] {e}")
        return []
    finally:
        if cursor: cursor.close()
        if db: db.close()