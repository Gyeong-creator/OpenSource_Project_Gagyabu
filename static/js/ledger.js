// HTML 요소 가져오기
const calendarDiv = document.getElementById('calendar');
const inputTitle = document.getElementById('input-title');
const form = document.getElementById('entry-form');
const applyBtn = document.getElementById('apply-btn');
const listDiv = document.getElementById('transaction-list');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');
const currentMonthTitle = document.getElementById('current-month');
const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');
const paySelect = document.getElementById('payment-method');
const categoryList = {
    "입금": ["급여", "금융소득", "용돈/지원금", "기타"],
    "출금": ["식비", "주거/통신", "교통/차량", "문화/여가", "생활/쇼핑", "건강/가족", "금융/기타"]
};

// 상태 관리
let selectedDate = null;
let currentDate = new Date();

// 페이지가 처음 로드될 때 실행될 함수
document.addEventListener('DOMContentLoaded', async () => {
    renderCalendar(currentDate);

    // 1. 처음 로딩될 때 화면 세팅
    updateFormState();

    // 2. 사용자가 유형(입금/출금)을 바꿀 때마다 화면 갱신
    typeSelect.addEventListener('change', updateFormState);

    // 3. [신규] 카테고리를 선택했을 때 지불수단 표시 여부 결정
    categorySelect.addEventListener('change', function() {
        const currentType = typeSelect.value;
        const currentCategory = categorySelect.value;

        // "출금"이면서 "카테고리"가 선택되었을 때만 지불수단 표시
        if (currentType === '출금' && currentCategory !== '') {
            paySelect.style.display = ''; // 보임
        } else {
            paySelect.style.display = 'none'; // 숨김
            paySelect.value = ''; // 값 초기화
        }
    });
});

/* [수정] 유형(입금/출금)에 따라 화면을 갱신하는 함수 */
function updateFormState() {
    const currentType = typeSelect.value; // '입금' 또는 '출금'

    if (currentType === '입금' || currentType === '출금') {
        typeSelect.style.maxWidth = '70px';
    } else {
        typeSelect.style.maxWidth = '';   // 스타일 제거 (원래 CSS로 돌아감)
    }
    
    // 1) 카테고리 옵션 새로 그리기
    categorySelect.innerHTML = ''; 

    // 선택된 유형에 맞는 리스트 가져오기
    const list = categoryList[currentType]; 
    
    if (list) {
        list.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }

    // 2) 지불수단 보이기/숨기기 처리 (출금이면 무조건 바로 보임)
    if (currentType === '출금') {
        paySelect.style.display = '';     // 바로 보이기!
    } else {
        paySelect.style.display = 'none'; // 입금이면 숨기기
        paySelect.value = '';             // 값 초기화
    }
}

/**
 * 달력을 생성하고 화면에 렌더링하는 함수
 */
function renderCalendar(date) {
    calendarDiv.innerHTML = '';
    const year = date.getFullYear();
    const month = date.getMonth();

    // --- '오늘' 날짜 정보 가져오기 ---
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    currentMonthTitle.textContent = `${year}년 ${month + 1}월`;
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('day', 'empty');
        calendarDiv.appendChild(emptyDay);
    }
    for (let i = 1; i <= totalDays; i++) {
        const day = document.createElement('div');
        day.classList.add('day');
        day.textContent = i;

        // --- '오늘' 및 '선택' 날짜 확인 ---
        const monthStr = String(month + 1).padStart(2, '0');
        const dayStr = String(i).padStart(2, '0');
        const currentDayStr = `${year}-${monthStr}-${dayStr}`;

        // 1. '오늘' 날짜 확인
        if (i === todayDate && month === todayMonth && year === todayYear) {
            day.classList.add('today');
        }
        // 2. '선택된' 날짜 확인 (global 'selectedDate' 변수와 비교)
        if (currentDayStr === selectedDate) {
            day.classList.add('selected');
        }

        day.onclick = () => selectDate(year, month, i);
        calendarDiv.appendChild(day);
    }
}

/**
 * 현재 날짜의 목록을 새로고침하는 헬퍼 함수
 */
async function refreshCurrentList() {
    if (!selectedDate) return;
    // selectedDate는 "YYYY-MM-DD" 형식의 문자열입니다.
    const [year, month, day] = selectedDate.split('-').map(Number);
    // JS의 Date 객체는 month를 0~11로 사용하므로 1을 빼줍니다.
    await selectDate(year, month - 1, day);
}

/**
 * 날짜를 선택했을 때 호출되는 함수
 */
async function selectDate(year, month, day) {
    document.getElementById('input-container').classList.remove('centered-prompt');
    listDiv.style.display = 'block';

    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    selectedDate = `${year}-${monthStr}-${dayStr}`; // ◀ 전역 변수 설정

    // 날짜 클릭 시 달력을 새로고침하여 .selected 클래스 적용 ---
    renderCalendar(currentDate); 
    
    inputTitle.textContent = `${selectedDate} 내역 입력`;
    form.style.display = 'flex';

    // 날짜를 클릭하면 해당 날짜의 API를 호출
    try {
        const res = await fetch(`/transactions-by-date?date=${selectedDate}`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || '데이터를 불러오는 데 실패했습니다.');
        }
        const data = await res.json();
        updateList(data.transactions || []); 
    } catch (error) {
        console.error('Error fetching date-specific transactions:', error);
        listDiv.innerHTML = `<h3>거래 내역</h3><p style="color: red;">${error.message}</p>`;
    }
}

// "이전 달", "다음 달" 버튼 클릭 이벤트
prevMonthBtn.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
};
nextMonthBtn.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
};

// "적용" 버튼 클릭 시
applyBtn.onclick = async () => {
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const desc = document.getElementById('desc').value;
    const amount = document.getElementById('amount').value;

    // 1. 기본 필수값 체크
    if (!desc || !amount || !selectedDate || !type || !category) {
        return alert('유형, 카테고리, 내역, 금액을 모두 입력해주세요.');
    }

    // 2. [중요] '출금'일 때만 지불수단 필수 체크
    if (type === '출금' && !paymentMethod) {
        return alert('출금 시 지불수단을 선택해주세요.');
    }

    try {
        const res = await fetch('/add', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ date: selectedDate, type, category, payment_method: paymentMethod, desc, amount })
        });
        
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || '등록에 실패했습니다.');
        }

        // 입력창 초기화
        document.getElementById('type').value = '';
        document.getElementById('desc').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('category').value = '';
        document.getElementById('payment-method').value = '';

    } catch (error) {
        console.error('Error adding transaction:', error);
        alert(error.message); 
    }
    
    // 목록 새로고침
    await refreshCurrentList();
};

// '삭제', '수정', '저장', '취소' 버튼 클릭을 감지하는 이벤트 리스너
listDiv.addEventListener('click', async function(event) {
    const target = event.target;
    const tr = target.closest('tr'); // 버튼이 속한 행(tr)
    if (!tr) return;

    const transactionId = tr.dataset.id; // 행에 저장된 ID

    // '삭제' 버튼 클릭 시
    if (target.classList.contains('delete-btn')) {
        if (transactionId) {
            await handleDelete(transactionId);
        }
    }
    
    // '수정' 버튼 클릭 시
    if (target.classList.contains('edit-btn')) {
        toggleEditMode(tr, true); // 수정 모드로 변경
    }
    
    // '저장' 버튼 클릭 시
    if (target.classList.contains('save-btn')) {
        if (transactionId) {
            await handleSave(tr, transactionId);
        }
    }

    // '취소' 버튼 클릭 시
    if (target.classList.contains('cancel-btn')) {
        toggleEditMode(tr, false); // '표시 모드'로 되돌리기
    }
});

/**
 * '수정' <-> '저장' 모드 전환 함수
 * - 다른 버튼 잠금 기능 추가
 */
function toggleEditMode(tr, isEditing) {
    const displayFields = tr.querySelectorAll('.display-field');
    const editFields = tr.querySelectorAll('.edit-field');

    const editBtn = tr.querySelector('.edit-btn');
    const deleteBtn = tr.querySelector('.delete-btn');
    const saveBtn = tr.querySelector('.save-btn');
    const cancelBtn = tr.querySelector('.cancel-btn');

    // 1. 모든 수정/삭제 버튼 잠금/해제 처리
    // listDiv는 상단에 선언된 전역 변수(transaction-list)입니다.
    const allEditBtns = listDiv.querySelectorAll('.edit-btn');
    const allDeleteBtns = listDiv.querySelectorAll('.delete-btn');

    if (isEditing) {
        // 수정 모드로 들어갈 때: 모든 버튼 비활성화
        allEditBtns.forEach(btn => btn.disabled = true);
        allDeleteBtns.forEach(btn => btn.disabled = true);
    } else {
        // 수정 모드 해제(저장/취소)할 때: 모든 버튼 활성화
        allEditBtns.forEach(btn => btn.disabled = false);
        allDeleteBtns.forEach(btn => btn.disabled = false);
    }

    // 2. 현재 행(Row)의 모드 전환
    displayFields.forEach(f => f.style.display = isEditing ? 'none' : '');
    editFields.forEach(f => f.style.display = isEditing ? '' : 'none');
    
    editBtn.style.display = isEditing ? 'none' : '';
    deleteBtn.style.display = isEditing ? 'none' : '';
    saveBtn.style.display = isEditing ? '' : 'none';
    cancelBtn.style.display = isEditing ? '' : 'none';

    // 3. 수정 모드 진입 시 데이터 세팅 (카테고리/지불수단 동기화)
    if (isEditing) {
        const typeSelect = tr.querySelector('.edit-type');
        const categorySelect = tr.querySelector('.edit-category');
        const paySelect = tr.querySelector('.edit-pay');
        
        const originalCategoryVal = categorySelect.value; 

        const refreshRowCategory = () => {
            const currentType = typeSelect.value;
            const list = categoryList[currentType] || [];
            
            categorySelect.innerHTML = '';

            list.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                
                // 현재 행의 원래 카테고리 값과 일치하면 선택되도록 함
                if (cat === originalCategoryVal) option.selected = true;

                categorySelect.appendChild(option);
            });
            // 최종적으로 값이 유지되도록 한 번 더 명시
            categorySelect.value = originalCategoryVal;
        };

        const toggleRowPay = () => {
            if (typeSelect.value === '입금') {
                paySelect.style.display = 'none';
                paySelect.value = '';
            } else {
                paySelect.style.display = '';
            }
        };

        refreshRowCategory();
        toggleRowPay();

        typeSelect.onchange = function() {
            const newType = this.value;
            const newList = categoryList[newType] || [];
            
            // 카테고리 드롭다운을 초기화
            categorySelect.innerHTML = '';

            // 새 카테고리 옵션을 추가
            newList.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                categorySelect.appendChild(option);
            });

            toggleRowPay();
        };
    }
}

/* '저장' 버튼 클릭 시 서버로 전송하는 함수 */
async function handleSave(tr, transactionId) {
    // 수정용 input/select 에서 새 값 가져오기
    const newDate = tr.querySelector('.edit-date').value;
    const newType = tr.querySelector('.edit-type').value;
    const newCategory = tr.querySelector('.edit-category').value;
    let newPay = tr.querySelector('.edit-pay').value; // let으로 선언 (수정 가능하게)
    const newDesc = tr.querySelector('.edit-description').value;
    const newAmount = tr.querySelector('.edit-amount').value;
    
    // [중요] 유형이 '입금'이면 지불수단은 무조건 빈 값으로 처리
    if (newType === '입금') {
        newPay = '';
    }

    if (!newDate || !newType || !newDesc || newAmount === '') {
        return alert('필수 항목을 입력하세요.');
    }
    
    // [추가] 출금인데 지불수단이 없으면 경고 (선택사항)
    if (newType === '출금' && !newPay) {
        return alert('출금 시 지불수단을 선택해야 합니다.');
    }

    try {
        const res = await fetch('/edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: transactionId, 
                date: newDate, 
                type: newType, 
                category: newCategory,
                payment_method: newPay, // 정제된 newPay 값 전송
                desc: newDesc, 
                amount: newAmount 
            })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || '수정에 실패했습니다.');
        }
    } catch (err) {
        console.error('Error saving transaction:', err);
        alert(err.message);
    }

    // 목록 새로고침
    await refreshCurrentList();
}


/* '삭제' 함수 (변경: 새로고침 로직 수정) */
async function handleDelete(transactionId) {
    
    if (!confirm('정말로 이 내역을 삭제하시겠습니까?')) {
        return;
    }

    try { 
        const res = await fetch('/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: transactionId }) 
        });
        
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || '삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert(error.message); 
    }
    
    // 목록 새로고침
    await refreshCurrentList();
}

/* 거래 내역 리스트 업데이트 함수 (수정 기능 추가) */
function updateList(transactions) {
    console.log(transactions); // (디버깅용)
    if (transactions.length === 0) {
        listDiv.innerHTML = `<h3>거래 내역</h3><p>해당 날짜의 거래 내역이 없습니다.</p>`;
        return;
    }

    let html = `
    <h3>거래 내역</h3>
    <table>
        <thead><tr><th>날짜</th><th>유형</th><th>카테고리</th><th>지불수단</th><th>내역</th><th>금액</th><th>관리</th></tr></thead>
        <tbody>
        ${transactions.map(t => {
            const transactionId = t.id; 
            const amount = parseInt(t.amount); // 금액 파싱
            const displayDate = (t.date || '').split('T')[0]; // 예: "2025-11-04T..." -> "2025-11-04"

            // 카테고리, 페이 null 처리
            const catVal = t.category || '';
            const payVal = t.pay || '';

            return `
                <tr data-id="${transactionId}">
                    
                    <td>
                        <span class="display-field">${displayDate}</span>
                        <input type="date" class="edit-field edit-date" value="${displayDate}" style="display:none;">
                    </td> 
                    
                    <td>
                        <span class="display-field">${t.type}</span>
                        <select class="edit-field edit-type" style="display:none;">
                            <option value="입금" ${t.type === '입금' ? 'selected' : ''}>입금</option>
                            <option value="출금" ${t.type === '출금' ? 'selected' : ''}>출금</option>
                        </select>
                    </td>

                    <td>
                        <span class="display-field">${catVal}</span>
                        <select class="edit-field edit-category" style="display:none;">
                            <option value="급여" ${catVal==='급여'?'selected':''}>급여</option>
                            <option value="금융소득" ${catVal==='금융소득'?'selected':''}>금융소득</option>
                            <option value="용돈/지원금" ${catVal==='용돈/지원금'?'selected':''}>용돈/지원금</option>
                            <option value="기타" ${catVal==='기타'?'selected':''}>기타</option>
                            
                            <option value="식비" ${catVal==='식비'?'selected':''}>식비</option>
                            <option value="주거/통신" ${catVal==='주거/통신'?'selected':''}>주거/통신</option>
                            <option value="교통/차량" ${catVal==='교통/차량'?'selected':''}>교통/차량</option>
                            <option value="문화/여가" ${catVal==='문화/여가'?'selected':''}>문화/여가</option>
                            <option value="생활/쇼핑" ${catVal==='생활/쇼핑'?'selected':''}>생활/쇼핑</option>
                            <option value="건강/가족" ${catVal==='건강/가족'?'selected':''}>건강/가족</option>
                            <option value="금융/기타" ${catVal==='금융/기타'?'selected':''}>금융/기타</option>
                        </select>
                    </td>

                    <td>
                        <span class="display-field">${payVal}</span>
                        <select class="edit-field edit-pay" style="display:none;">
                            <option value="카드" ${payVal==='카드'?'selected':''}>카드</option>
                            <option value="현금" ${payVal==='현금'?'selected':''}>현금</option>
                            <option value="계좌이체" ${payVal==='계좌이체'?'selected':''}>계좌이체</option>
                        </select>
                    </td>
                    
                    <td>
                        <span class="display-field">${t.description}</span>
                        <input type="text" class="edit-field edit-description" value="${t.description || ''}" style="display:none;">
                    </td> 
                    
                    <td class="${t.type === '입금' ? 'deposit' : ''}">
                        <span class="display-field">${amount.toLocaleString()} 원</span>
                        <input type="number" class="edit-field edit-amount" value="${amount}" style="display:none;">
                    </td>
                    
                    <td>
                        <button class="edit-btn">&#9999;</button> 
                        <button class="save-btn" style="display:none;">저장</button>
                        <button class="cancel-btn" style="display:none;">취소</button>
                        <button class="delete-btn" data-id='${transactionId}'>&times;</button>
                    </td>
                </tr>
            `;
        }).join('')}
        </tbody>
    </table>
    `;
    listDiv.innerHTML = html;
}