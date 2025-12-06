## 🧾 실행 방법 (How to Run)

이 프로젝트는 **Flask + MySQL 기반 웹 가계부 서비스**입니다.  
아래 순서를 따라 로컬 환경에서 서버를 실행할 수 있습니다.

<br>
<br>

### 1. 사전 준비 (Prerequisites)

- Python **3.10+**
- MySQL 서버 (로컬 또는 원격)
- Git
- (선택) DBeaver 등 MySQL GUI 툴

<br>


### 2. 프로젝트 설치 (Clone & Install)

1. 저장소를 클론합니다.

```bash
git clone https://github.com/Gyeong-creator/-5-.git
cd -5-
```

2.  (선택) 파이썬 가상환경을 생성하고 활성화합니다.
    

```bash
# Mac / Linux
python3 -m venv venv
source venv/bin/activate

# Windows (예시)
python -m venv venv
venv\Scripts\activate
```

3.  필수 패키지를 설치합니다.
    

```bash
pip install -r requirements.txt
```

<br>


### 3. 데이터베이스 설정 (MySQL)

이 프로젝트는 MySQL을 사용하며, ERD에 정의된 스키마를 기준으로 동작합니다.

1.  MySQL에서 데이터베이스를 생성합니다.
    

```sql
CREATE DATABASE gagyabu DEFAULT CHARACTER SET utf8mb4;
```

2.  제공된 백업 파일을 이용해 스키마 및 테스트 데이터를 복원할 수 있습니다.
    -   `db_backup.zip` 파일을 다운로드 후 압축 해제
    -   DBeaver에서
        -   `도구` → `Restore database` 선택
        -   추출된 `.sql` 파일 선택
        -   Log level = Normal
        -   `Start` 클릭
            
> 직접 테이블을 만들어도 되고, 백업 파일을 복원해서 바로 테스트해도 됩니다.  
> 데이터 구조는 README/문서에 포함된 ERD와 동일합니다.

<br>

### 4. 필수 설정 파일 생성
일부 파일은 `.gitignore`에 포함되어 있어, 각자 로컬에서 직접 생성해야 합니다.


#### 4-1) `modules/__init__.py`
-   경로: `modules/__init__.py`
-   내용: 비워둬도 됩니다. (Flask 패키지 인식을 위한 용도)
    
#### 4-2) `modules/config.py`
-   로컬 DB 접속 정보 및 Flask 시크릿 키를 설정하는 파일입니다.
-   아래 예시를 참고해, **각자 환경에 맞는 값으로 수정**합니다.
    

```python
# modules/config.py
host = '127.0.0.1'          # MySQL 호스트
port = 3306                 # MySQL 포트
user = 'root'               # MySQL 계정
passwd = 'your_password!'   # 각자 비밀번호
db = 'gagyabu'              # 사용하는 DB 이름
secret = 'your_secret_key'  # 세션용 시크릿 키 (랜덤 문자열)
```

> ⚠️ 실제 비밀번호/시크릿 키는 **공개 저장소에 올리지 말고**,  
> 로컬 설정 또는 팀 내부 공유 문서로만 관리하는 것을 추천합니다.


<br>

### 5. 서버 실행 (Run)
1.  프로젝트 루트 디렉토리에서 아래 명령어를 실행합니다.
    
```bash
python app.py
```

또는 Flask CLI를 사용하는 경우:

```bash
export FLASK_APP=app.py      # Windows: set FLASK_APP=app.py
flask run
```

2.  브라우저에서 접속:
    
```text
http://127.0.0.1:8080
```

> 실제 포트 번호는 코드 설정에 따라 다를 수 있습니다. (기본값: 8080)

<br>

### 6. 기본 동작 확인
-   메인 페이지 접속 후, 수입/지출 내역 추가, 목록 조회, 통계 등을 테스트해 볼 수 있습니다.
-   DB에 정상적으로 연결되지 않은 경우,
    -   `modules/config.py` 설정 값 (host/port/user/password/db)
    -   MySQL 서버 실행 여부  를 먼저 확인해주세요.
        


