// 1. 폼(form) 요소와 폼 안의 입력(input) 요소들을 ID로 가져옵니다.
//    (register.html에 설정한 ID와 동일해야 합니다)
const registerForm = document.getElementById('register-form');
const usernameInput = document.getElementById('username-field');
const idInput = document.getElementById('id-field');
const passwordInput = document.getElementById('password-field');

// 2. 회원가입 폼에서 'submit' 이벤트가 발생하면 (가입하기 버튼 클릭)
//    handleRegisterSubmit 함수를 실행하도록 설정합니다.
if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
}

/**
 * 3. 회원가입 폼 제출(submit) 시 실행되는 비동기 함수
 */
async function handleRegisterSubmit(event) {
    // 4. form의 기본 동작(페이지가 새로고침되는 것)을 막습니다.
    event.preventDefault();

    // 5. 각 입력란의 값을 가져옵니다. (trim()으로 양쪽 공백 제거)
    const username = usernameInput.value.trim();
    const id = idInput.value.trim();
    const password = passwordInput.value.trim();

    // 6. (기본 검증) 하나라도 비어있으면 알림을 띄우고 함수를 종료합니다.
    if (!username || !id || !password) {
        alert('모든 항목을 입력해주세요.');
        return; // 함수 실행 중단
    }
    
    // 7. 서버 API(app.py)에 보낼 데이터를 JSON 객체로 만듭니다.
    //    (app.py의 /api/register에서 받을 key 이름과 동일해야 함)
    const data = {
        username: username,
        id: id,
        password: password
    };

    // 8. fetch를 사용해 서버에 API 요청을 보냅니다.
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // 9. 서버의 응답을 처리합니다.
        
        // 9-1. 성공 시 (app.py에서 201 Created 코드를 반환하기로 함)
        if (response.status === 201) {
            const result = await response.json(); // { ok: true, username: "..." }
            
            // [기대 결과] 등록 완료 알림
            alert('회원가입이 완료되었습니다.');
            
            // [기대 결과] 로그인 페이지로 이동 + 방금 등록한 아이디 자동 입력
            // (login.html?username=방금등록한ID)
            window.location.href = `/login?username=${result.username}`;
        
        // 9-2. 실패 시 (app.py에서 400 또는 500 코드를 반환)
        } else {
            const errorData = await response.json(); // { ok: false, error: "..." }
            
            // [기대 결과] 적절한 에러 메시지 표시
            alert(`회원가입 실패: ${errorData.error || '알 수 없는 오류'}`);
        }

    // 10. 네트워크 자체에 문제가 생긴 경우 (서버 다운 등)
    } catch (error) {
        console.error('Register API Error:', error);
        alert('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
}