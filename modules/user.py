import pymysql
from . import config

def db_connector():
    """
    데이터베이스 연결 객체를 생성합니다.

    Returns:
        pymysql.Connection: DB 연결 객체
    """
    try:
        conn = pymysql.connect(
            host=config.host,
            port=config.port,
            user=config.user,
            password=config.passwd,
            db=config.db,
            charset='utf8mb4',
            # cursorclass=pymysql.cursors.DictCursor:
            # 쿼리 결과를 Python 딕셔너리 형태로 받기 위한 설정입니다.
            cursorclass=pymysql.cursors.DictCursor
        )
        return conn
    except Exception as e:
        print(f"[DB CONNECT ERROR] {type(e).__name__}: {e}")
        raise

def select_user_info(id, pw):
    """
    (보안 위험! 테스트용) ID와 평문 비밀번호로 사용자를 조회합니다.
    (추후 반드시 비밀번호 해시를 비교하는 방식으로 변경해야 합니다.)

    Args:
        id (str): 사용자가 입력한 아이디
        pw (str): 사용자가 입력한 비밀번호 (평문)

    Returns:
        dict or None: 사용자 정보 딕셔너리, 일치하는 사용자가 없으면 None
    """
    db = db_connector()
    # DictCursor를 인자로 넘겨, 이 쿼리의 결과만 딕셔너리로 받습니다.
    cur = db.cursor(pymysql.cursors.DictCursor) 
    try:
        # (보안 경고: SQL injection에 취약할 수 있으며, 비밀번호를 평문으로 비교합니다.)
        cur.execute("SELECT * FROM user WHERE id=%s AND password=%s", (id, pw))
        row = cur.fetchone() 
        return row or None
    finally:
        cur.close()
        db.close()

# -------------------------------------------------------------
# [신규] 회원가입 관련 함수
# -------------------------------------------------------------
def check_user_exists(id):
    """
    ID 중복 여부를 확인합니다.
    """
    db = db_connector()
    cur = db.cursor()
    try:
        cur.execute("SELECT id FROM user WHERE id=%s", (id,))
        return cur.fetchone() is not None
    finally:
        cur.close()
        db.close()

def create_user(user_name, id, password):
    """
    새로운 사용자를 DB에 등록합니다.
    (보안 위험: 비밀번호를 평문으로 저장합니다. 해시 함수를 사용해야 합니다.)

    Returns:
        tuple: (성공 여부 bool, 이유 str)
    """
    if check_user_exists(id):
        return False, "duplicate_id"

    db = db_connector()
    cur = db.cursor()
    try:
        # SQL Injection 방지를 위해 %s 플레이스홀더를 사용합니다.
        sql = "INSERT INTO user (user_name, id, password) VALUES (%s, %s, %s)"
        cur.execute(sql, (user_name, id, password))
        db.commit()
        return True, ""
    except Exception as e:
        print(f"[DB INSERT ERROR] {type(e).__name__}: {e}")
        db.rollback()
        return False, "db_error"
    finally:
        cur.close()
        db.close()