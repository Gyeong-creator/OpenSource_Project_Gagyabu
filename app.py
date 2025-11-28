# --- 1. 라이브러리 및 모듈 임포트 ---
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from datetime import timedelta, date
from calendar import monthrange
import re  # 정규표현식

# 사용자 정의 모듈 (modules 폴더 안에 있어야 함)
import modules.user as user_db       # modules/user.py
import modules.ledger as ledger_db   # modules/ledger.py
import modules.config as config      # modules/config.py

# ====================== flask & session 설정 ======================
app = Flask(__name__)
app.secret_key = config.secret  # config.py 안에 secret 변수가 있어야 함
app.permanent_session_lifetime = timedelta(hours=6)

# 보안 옵션 (HTTPS 환경이 아니면 secure 옵션은 주석 처리 유지)
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax"
)

# ====================== 전역 설정 (Context Processor) ======================
@app.context_processor
def inject_user():
    """모든 HTML 템플릿에서 username과 id를 사용할 수 있게 함"""
    return {
        'username': session.get('username'),
        'id': session.get('id')
    }

@app.before_request
def require_login_for_all_except_public():
    """로그인 안 한 사용자는 로그인 페이지로 튕겨내기 (화이트리스트 방식)"""
    # 접근 허용할 엔드포인트 이름들
    public_endpoints = {'login_view', 'login', 'register_view', 'register', 'static'}
    
    ep = (request.endpoint or '').split('.')[0]
    
    if ep in public_endpoints:
        return 

    if not session.get('id'):
        # API 요청이면 401 에러 반환, 일반 페이지 요청이면 로그인 페이지로 이동
        if request.is_json or request.path.startswith(('/add', '/delete', '/transactions', '/api')):
            return jsonify(success=False, message='Login required'), 401
        return redirect(url_for('login_view', next=request.path))

# ====================== 페이지 라우팅 (View) ======================
@app.route('/')
def index():
    if session.get('id'):
        return redirect(url_for('ledger_view'))
    return render_template('login.html')

@app.route('/login')
def login_view():
    if session.get('id'):
        return redirect(url_for('ledger_view'))
    return render_template('login.html')

@app.route('/register')
def register_view():
    """ [신규] 회원가입 페이지 보여주기 """
    if session.get('id'):
        return redirect(url_for('ledger_view'))
    return render_template('register.html')

@app.route('/ledger')
def ledger_view():
    return render_template('ledger.html')

@app.route('/statistics')
def statistics_view():
    return render_template('statistics.html')

# ====================== 회원가입 & 로그인 API ======================

@app.route('/api/register', methods=['POST'])
def register():
    """
    [신규] 회원가입 처리 API
    """
    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "잘못된 요청입니다."}), 400

    username = data.get('username')
    user_id = data.get('id')
    password = data.get('password')

    if not all([username, user_id, password]):
        return jsonify({"ok": False, "error": "모든 항목을 입력해주세요."}), 400
    
    try:
        # user_db.create_user 함수 호출
        success, reason = user_db.create_user(username, user_id, password)
        
        if success:
            return jsonify({"ok": True, "username": user_id}), 201
        else:
            if reason == "duplicate_id":
                return jsonify({"ok": False, "error": "이미 사용 중인 아이디입니다."}), 400
            else:
                return jsonify({"ok": False, "error": "서버 내부 오류가 발생했습니다."}), 500

    except Exception as e:
        print(f"API Error: {e}")
        return jsonify({"ok": False, "error": "알 수 없는 오류가 발생했습니다."}), 500

@app.route('/login_check', methods=['POST'])
def login():
    data = request.get_json()
    id = data.get('id')
    password = data.get('password')

    result = user_db.select_user_info(id, password)
    if result == None:
        return jsonify(success=False)

    session['id'] = result['id']       
    session['username'] = result['user_name']   
    session.permanent = True

    nxt = request.args.get('next') or data.get('next')
    if not nxt or not nxt.startswith('/'):
        nxt = url_for('index')
    return jsonify(success=True, next=nxt)

@app.route('/logout', methods=['GET', 'POST'])
def logout():
    session.clear() 
    return redirect(url_for('login_view'))

# ====================== 가계부(Ledger) API ======================

@app.route('/transactions')
def get_transactions():
    user_id = session.get('id')
    transactions_list = ledger_db.select_ledger_by_user(user_id)

    for item in transactions_list:
        if 'date' in item and hasattr(item['date'], 'isoformat'):
            item['date'] = item['date'].isoformat()

    return jsonify({'transactions': transactions_list})

@app.route('/transactions-by-date')
def get_transactions_by_date():
    user_id = session.get('id')
    selected_date = request.args.get('date')
    
    if not selected_date:
        return jsonify({"error": "Date parameter is required"}), 400

    transactions_list = ledger_db.select_transactions_by_date(user_id, selected_date)

    for item in transactions_list:
        if 'date' in item and hasattr(item['date'], 'isoformat'):
            item['date'] = item['date'].isoformat()

    return jsonify({'transactions': transactions_list})
# 지금 /add 이거 수정해야됨////////////////////////////
@app.route('/add', methods=['POST'])
def add_transaction():
    user_id = session.get('id')
    if request.is_json:
        data = request.get_json()
        try:
            ledger_db.insert_transaction(
                user_id,
                data.get('date'),
                data.get('type'),
                data.get('desc'),
                data.get('amount'),
                category=data.get('category'),
                pay=data.get('payment_method')
            )
            # 갱신된 목록 반환
            latest_transactions = ledger_db.select_ledger_by_user(user_id)
            for item in latest_transactions:
                if 'date' in item and hasattr(item['date'], 'isoformat'):
                    item['date'] = item['date'].isoformat()
            return jsonify({'transactions': latest_transactions})

        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({"error": "Request must be JSON"}), 400

@app.route('/delete', methods=['POST'])
def delete_transaction():
    user_id = session.get('id')
    if request.is_json:
        data = request.get_json()
        transaction_id = data.get('id')
        try:
            ledger_db.delete_transaction_by_id(transaction_id, user_id)
            # 갱신된 목록 반환
            latest_transactions = ledger_db.select_ledger_by_user(user_id)
            for item in latest_transactions:
                if 'date' in item and hasattr(item['date'], 'isoformat'):
                    item['date'] = item['date'].isoformat()
            return jsonify({'transactions': latest_transactions})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({"error": "Request must be JSON"}), 400

@app.route('/edit', methods=['POST'])
def edit_transaction():
    user_id = session.get('id')
    if request.is_json:
        data = request.get_json()
        
        transaction_id = data.get('id')
        new_date = data.get('date')
        new_type = data.get('type')
        new_desc = data.get('desc')
        new_amount = data.get('amount')
        new_category = data.get('category')
        new_payment = data.get('payment_method')

        if not all([transaction_id, new_date, new_type, new_desc, new_amount is not None]):
             return jsonify({'error': '모든 값이 필요합니다.'}), 400

        try:
            ledger_db.update_transaction(
                transaction_id, 
                user_id, 
                new_date, 
                new_type, 
                new_desc, 
                new_amount,
                new_category,
                new_payment
            )
            return jsonify({'success': True})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({"error": "Request must be JSON"}), 400

# ====================== 통계(Stats) API ======================

@app.route('/api/stats/monthly-total')
def stats_monthly_total():
    user_id = session.get('id')
    today = date.today()
    year = int(request.args.get('year', today.year))
    month = int(request.args.get('month', today.month))
    days = monthrange(year, month)[1]
    start = date(year, month, 1)
    end = date(year + (month == 12), 1 if month == 12 else month + 1, 1)

    data = ledger_db.select_month_ledger_by_user(user_id, year, month, days, start, end)
    return jsonify(data)  

@app.route('/api/stats/monthly-spend')
def stats_monthly_spend():
    user_id = session.get('id')
    today = date.today()
    year = int(request.args.get('year', today.year))
    month = int(request.args.get('month', today.month))
    days = monthrange(year, month)[1]
    start = date(year, month, 1)
    end = date(year + (month == 12), 1 if month == 12 else month + 1, 1)

    data = ledger_db.select_month_daily_spend_income(user_id, start, end, year, month, days)
    return jsonify(data)

@app.route('/api/stats/monthly-cats')
def stats_monthly_cats():
    user_id = session.get('id')
    today = date.today()
    year  = int(request.args.get('year',  today.year))
    month = int(request.args.get('month', today.month))
    start = date(year, month, 1)
    end   = date(year + (month == 12), 1 if month == 12 else month + 1, 1)

    data = ledger_db.select_month_category_spend(user_id, start, end)
    return jsonify(data)

@app.route('/api/stats/weekly')
def stats_weekly():
    user_id = session.get('id')
    n = int(request.args.get('n', 10))
    data = ledger_db.select_recent_weeks(user_id, n)
    return jsonify(data)

@app.route('/api/stats/spending-advice')
def stats_spending_advice():
    user_id = session.get('id')
    try:
        today = date.today()
        this_month_start = today.replace(day=1)
        this_month_days = monthrange(today.year, today.month)[1]
        next_month_start = (this_month_start + timedelta(days=32)).replace(day=1)
        
        this_month_data = ledger_db.select_month_daily_spend_income(
            user_id, this_month_start, next_month_start, 
            today.year, today.month, this_month_days
        )
        
        TMI = this_month_data.get('totalIncome', 0)
        TMS = this_month_data.get('totalSpend', 0)

        last_month_end = this_month_start
        last_month_start = (last_month_end - timedelta(days=1)).replace(day=1)
        last_month_year = last_month_start.year
        last_month_month = last_month_start.month
        last_month_days = monthrange(last_month_year, last_month_month)[1]

        last_month_data = ledger_db.select_month_daily_spend_income(
            user_id, last_month_start, last_month_end,
            last_month_year, last_month_month, last_month_days
        )
        
        LMI = last_month_data.get('totalIncome', 0)
        LMS = last_month_data.get('totalSpend', 0)

        last_month_budget = LMI - LMS 
        total_allowable = last_month_budget + TMI 
        
        warning_message = None

        if total_allowable > 0:
            spending_ratio = TMS / total_allowable
            if spending_ratio > 0.7:
                warning_message = f"지출이 총 예산의 {spending_ratio*100:.0f}%에 도달했습니다! 지출에 유의하세요."
        elif TMS > TMI:
             warning_message = "이번 달 수입보다 지출이 더 많습니다! 지출 관리가 필요합니다."

        return jsonify({'advice': warning_message})

    except Exception as e:
        print(f"[API ADVICE ERROR] {type(e).__name__}: {e}")
        return jsonify({'error': str(e)}), 500

# ====================== 서버 실행 ======================
if __name__ == "__main__":
    app.run(debug=True, port=8080)