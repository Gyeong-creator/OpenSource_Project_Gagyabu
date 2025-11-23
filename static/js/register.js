document.addEventListener('DOMContentLoaded', () => {
    // HTML ID와 일치시킴
    const togglePassword      = document.getElementById('signup-toggle-password');
    const passwordField       = document.getElementById('signup-password');
    const passwordConfirmField= document.getElementById('signup-password-confirm');
    const signupBtn           = document.getElementById('signup-btn');
    const idField             = document.getElementById('signup-id');
    const nameField           = document.getElementById('signup-name');
    const form                = document.getElementById('signup-form');

    // 1. 비밀번호 보기/숨김 기능 (UI 로직)
    if (togglePassword && passwordField) {
        togglePassword.addEventListener('click', function () {
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
            this.textContent = type === 'password' ? '보기' : '숨김';
        });
    }

    // 2. 회원가입 버튼 클릭 시 처리
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault(); // 새로고침 방지

            const id       = idField.value.trim();
            const name     = nameField.value.trim();
            const password = passwordField.value.trim(); // 비밀번호도 공백 제거 권장
            const confirm  = passwordConfirmField.value.trim();

            // [검증 1] 필수 입력 확인
            if (!id || !name || !password || !confirm) {
                alert("모든 정보를 입력해주세요!");
                return;
            }

            // [검증 2] 비밀번호 길이
            if (password.length < 8) {
                alert("비밀번호는 8자 이상이어야 합니다.");
                return;
            }

            // [검증 3] 비밀번호 일치 확인
            if (password !== confirm) {
                alert("비밀번호가 서로 일치하지 않습니다.");
                return;
            }

            // 3. 서버로 데이터 전송 (app.py와 통신)
            const payload = {
                id: id,          // app.py에서 data.get('id')로 받음
                username: name,  // app.py에서 data.get('username')로 받음
                password: password
            };

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.status === 201 && result.ok) {
                    // 성공 시
                    alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
                    window.location.href = '/login'; 
                } else {
                    // 실패 시 (중복 아이디 등)
                    alert(result.error || "회원가입에 실패했습니다.");
                }

            } catch (error) {
                console.error('Error:', error);
                alert("서버 통신 중 오류가 발생했습니다.");
            }
        });
    }
});