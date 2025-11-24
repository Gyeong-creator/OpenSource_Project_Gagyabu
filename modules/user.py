import pymysql
from modules import config

# 1. DB 연결 함수
def db_connector():
    # config.py에 정의된 db_config 정보를 사용하여 DB에 연결
    return pymysql.connect(**config.db_config)

# 2. [기존 기능] 로그인 확인용 함수
def select_user_info(user_id, user_pw):
    conn = db_connector()
    cur = conn.cursor(pymysql.cursors.DictCursor)
    
    sql = "SELECT * FROM user WHERE id=%s AND password=%s"
    cur.execute(sql, (user_id, user_pw))
    result = cur.fetchone()
    
    cur.close()
    conn.close()
    return result

def create_user(username, user_id, password):
    """
    회원가입 로직
    - Return: (성공여부 True/False, 메시지 문자열)
    """
    conn = None
    cur = None
    try:
        conn = db_connector()
        cur = conn.cursor()

        # (1) 아이디 중복 체크
        cur.execute("SELECT id FROM user WHERE id=%s", (user_id,))
        if cur.fetchone():
            return False, "duplicate_id"

        # (2) 사용자 정보 DB에 저장
        sql = "INSERT INTO user (id, user_name, password) VALUES (%s, %s, %s)"
        cur.execute(sql, (user_id, username, password))
        
        conn.commit()
        return True, "success"

    except Exception as e:
        print(f"DB Error in create_user: {e}")
        return False, "database_error"

    finally:
        # DB 연결 종료 (에러가 나도 무조건 실행)
        if cur: cur.close()
        if conn: conn.close()