from flask import Flask, render_template
app = Flask(__name__)
app.secret_key = config.secret  
app.permanent_session_lifetime = timedelta(hours=6)  # session validate time


# security option(HTTPS)
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax"
    # SESSION_COOKIE_SECURE=True
)


DATA_FILE = 'transactions.json'








# ====================== preprocess ======================
# Expose session values (e.g., username, role) globally to all templates
@app.context_processor
def inject_user():
    return {
        'username': session.get('username'),
        'id': session.get('id')
    }





    # ... (이하 코드 동일) ...
@app.before_request
def require_login_for_all_except_public():
    public_endpoints = {'login_view', 'login', 'register_view', 'register', 'static'}  # 로그인 없이 접근 허용
    ep = (request.endpoint or '').split('.')[0]           # blueprint 대비


    if ep in public_endpoints:
        return 


    if not session.get('id'):
        # JSON 요청이면 JSON으로, 그 외는 로그인 페이지로
        if request.is_json or request.path.startswith(('/add', '/delete', '/transactions')):
            return jsonify(success=False, message='Login required'), 401
        return redirect(url_for('login_view', next=request.path))








# ====================== 라우팅 (경로 설정) ======================
@app.route('/')
def index():
    if session.get('id'):
        return redirect(url_for('ledger_view'))
    return render_template('login.html')



# 세션(로그인 상태 유지 등)을 사용하기 위한 비밀 키 (config.py에서 가져옴)
app.secret_key = config.secret  
# 세션(로그인)이 유지되는 시간 설정 (6시간)
app.permanent_session_lifetime = timedelta(hours=6)

# 세션 쿠키의 보안 관련 설정
app.config.update(
    SESSION_COOKIE_HTTPONLY=True, # JavaScript로 쿠키 접근 방지
    SESSION_COOKIE_SAMESITE="Lax" # CSRF 공격 방지를 위한 설정
    # SESSION_COOKIE_SECURE=True # (HTTPS 배포 시 활성화)
)


# ====================== 3. 전처리 함수 (모든 요청 전에 실행) ======================

# 모든 HTML 템플릿('{{ username }}')에서 세션 값을 바로 사용할 수 있도록 변수를 주입
@app.context_processor
def inject_user():
    return {
        'username': session.get('username'),
        'id': session.get('id')
    }

# (중요) 모든 페이지 요청이 들어오기 직전에 실행되어 로그인 여부를 검사
@app.before_request
def require_login_for_all_except_public():
    # 로그인이 필요 없는 페이지(엔드포인트) 목록
    public_endpoints = {'login_view', 'login', 'static'}  
    ep = (request.endpoint or '').split('.')[0] # 현재 요청된 엔드포인트 이름

    # 요청된 페이지가 public_endpoints에 속하면, 검사 없이 통과
    if ep in public_endpoints:
        return 

    # (핵심) 세션에 'id'가 없으면 (즉, 로그인이 안 되어 있으면)
    if not session.get('id'):
        # 만약 API(JSON) 요청이었다면 (예: /add), JSON으로 에러 메시지 반환
        if request.is_json or request.path.startswith(('/add', '/delete', '/transactions')):
            return jsonify(success=False, message='Login required'), 401
        # 일반 페이지 요청이었다면, 로그인 페이지로 강제 리디렉션
        return redirect(url_for('login_view', next=request.path))

# ====================== 4. 페이지 뷰 라우팅 (HTML 렌더링) ======================

# 메인 페이지 ('/')
@app.route('/')
def index():
    # 로그인 되어 있으면 가계부 페이지로, 아니면 로그인 페이지로 보냄
    if session.get('id'):
        return redirect(url_for('ledger_view'))
    return render_template('login.html')

# 로그인 페이지 뷰
@app.route('/login')
def login_view():
    return render_template('login.html')

@app.route('/ledger')
def ledger_view():
    # (@before_request가 이미 로그인 여부를 검사했으므로, 이 함수는 실행됨)
    return render_template('ledger.html')

@app.route('/statistics')
def statistics_view():
    # (@before_request가 이미 로그인 여부를 검사했으므로, 이 함수는 실행됨)
    return render_template('statistics.html')

    

if __name__ == "__main__":
    app.run(debug=False, port=8080)