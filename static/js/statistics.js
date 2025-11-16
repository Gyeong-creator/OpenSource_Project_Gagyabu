console.log('statistics.js loaded');

(function () {

	// ---------- Helpers ----------
	const won = n => (Math.round(n)).toLocaleString('ko-KR') + '원';
	const sum = a => a.reduce((x, y) => x + y, 0);
	const lastDay = (y, m) => new Date(y, m, 0).getDate(); // m: 1~12

	function setRangeFor(elId, year, month){
		const mm = String(month).padStart(2, '0');
		const last = lastDay(year, month);
		const el = document.getElementById(elId);
		if (el) el.textContent = `${year}.${mm}.01 ~ ${year}.${mm}.${last}`;
	}

	function prevYM(year, month){ // month: 1~12
		return month === 1 ? {year: year-1, month: 12} : {year, month: month-1};
	}

	function addMonth(year, month, delta) {
		// delta: +1이면 다음달, -1이면 이전달
		const d = new Date(year, month - 1 + delta, 1);
		return { year: d.getFullYear(), month: d.getMonth() + 1 };
	}

	function alignToLen(arr, len){
		if (arr.length === len) return arr.slice();
		if (arr.length > len)   return arr.slice(0, len);
		const out = arr.slice();
		const last = out[out.length-1] || 0;
		while(out.length < len) out.push(last);
		return out;
	}

	// ---------- 기본 상태----------
	let state = {
		weeksLabels: [],
		weeksTotals: [],
		monthCats: {},
		incomeTotal: 0,
		expense: { total: 0, card: 0, transfer: 0, other: 0 },
	};

	// ---------- 기간 상태 (전역) ----------
	const today = new Date();

	// 월간(합계/지출/카테고리)에서 공통으로 사용할 기준 연/월
	let monthYM = {
		year: today.getFullYear(),
		month: today.getMonth() + 1,
	};

	// 주간 통계: 0이면 "최근 10주", 1이면 "그 이전 10주", 2면 "그 이전 10주" …
	let weeklyOffset = 0;
	

	// ---------- Tabs ----------
	function bindTabs() {
		document.querySelectorAll('.tab').forEach(t => {
		t.addEventListener('click', () => {
			document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
			document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
			t.classList.add('active');

			const target = document.getElementById(t.dataset.panel);
			if (target) target.classList.remove('hidden');

			const balanceCard = document.getElementById("balanceCard");
			if (t.dataset.panel === "monthlyTotal") balanceCard.classList.remove("hidden");
			else balanceCard.classList.add("hidden");
		});
		});
	}

		// ---------- 기간 이동 버튼 바인딩 ----------
		function bindRangeButtons() {
			const cy = today.getFullYear();
			const cm = today.getMonth() + 1;
	
			const clampToNow = (y, m) => {
				// 미래(이번달 이후)로는 못 가게 막기
				if (y > cy || (y === cy && m > cm)) return { year: cy, month: cm };
				return { year: y, month: m };
			};
	
			// --- 월간 합계/지출: 한 달씩 이동 ---
			const before1 = document.getElementById('beforeOp1');
			const after1 = document.getElementById('afterOp1');
			const before2 = document.getElementById('beforeOp2');
			const after2 = document.getElementById('afterOp2');
	
			if (before1) before1.addEventListener('click', async () => {
				monthYM = addMonth(monthYM.year, monthYM.month, -1);
				await updateMonthlyTotalSection();
				await updateMonthlySpendSection();
				updateCategoryPills();
			});
	
			if (after1) after1.addEventListener('click', async () => {
				const next = addMonth(monthYM.year, monthYM.month, +1);
				const clamped = clampToNow(next.year, next.month);
				// 이번달보다 더 미래면 무시
				if (clamped.year === monthYM.year && clamped.month === monthYM.month) return;
	
				monthYM = clamped;
				await updateMonthlyTotalSection();
				await updateMonthlySpendSection();
				updateCategoryPills();
			});
	
			// 월간 지출 카드의 화살표도 같은 monthYM을 공유하도록 동일 동작
			if (before2) before2.addEventListener('click', async () => {
				monthYM = addMonth(monthYM.year, monthYM.month, -1);
				await updateMonthlyTotalSection();
				await updateMonthlySpendSection();
				updateCategoryPills();
			});
	
			if (after2) after2.addEventListener('click', async () => {
				const next = addMonth(monthYM.year, monthYM.month, +1);
				const clamped = clampToNow(next.year, next.month);
				if (clamped.year === monthYM.year && clamped.month === monthYM.month) return;
	
				monthYM = clamped;
				await updateMonthlyTotalSection();
				await updateMonthlySpendSection();
				updateCategoryPills();
			});
	
			// --- 주간 합계: 10주씩 이동 ---
			const before3 = document.getElementById('beforeOp3');
			const after3 = document.getElementById('afterOp3');
	
			if (before3) before3.addEventListener('click', async () => {
				weeklyOffset += 1; // 과거로 10주 더
				await updateWeeklySection();
			});
	
			if (after3) after3.addEventListener('click', async () => {
				if (weeklyOffset === 0) return; // 더 앞으로는 못감(현재가 기준)
				weeklyOffset -= 1;
				await updateWeeklySection();
			});
		}
	

	// ---------- 공통 Chart.js 렌더 ----------
	function renderChart(canvas, datasets, labels, extraOptions = {}) {
		const ctx = canvas.getContext('2d');
		if (canvas._chartInstance) canvas._chartInstance.destroy();
	  
		const defaultOptions = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: { legend: { display: true, position: 'top' } },
			scales: { y: { beginAtZero: true } }
		};
	  
		const chart = new Chart(ctx, {
			type: 'line',
			data: { labels, datasets },
			options: Object.assign({}, defaultOptions, extraOptions)
		});
	  
		canvas._chartInstance = chart;
	}
	  
	// ---------- 데이터 요청 ----------
	async function fetchMonthlySpend(year, month) {
		const res = await fetch(`/api/stats/monthly-spend?year=${year}&month=${month}`);
		if (!res.ok) throw new Error('monthly-spend api failed');
		return res.json(); // { labels, dailySpend, dailyIncome, cumSpend, cumIncome, totalSpend, totalIncome }
	}

	// ---------- 월간 합계 (수입 - 지출 = 순변화) ----------
		// ---------- 월간 합계 (수입 - 지출 = 순변화) ----------
		async function updateMonthlyTotalSection(year = monthYM.year, month = monthYM.month) {
			// 화면 상단 기간 표시
			setRangeFor('rangeMonthly', year, month);
	
			// {labels, cumSpend, cumIncome} 반환 - /api/stats/monthly-spend 응답
			const { labels = [], cumSpend = [], cumIncome = [] } =
				await fetchMonthlySpend(year, month);
	
			// 누적 순변화 = 누적수입 − 누적지출
			const len = Math.max(cumIncome.length, cumSpend.length);
			const cumNet = Array.from({ length: len }, (_, i) =>
				(cumIncome[i] || 0) - (cumSpend[i] || 0)
			);
	
			// KPI (오늘 값/증감)
			const lastVal = cumNet.at(-1) || 0;
			const prevVal = cumNet.at(-2) || 0;
			const delta = lastVal - prevVal;
	
			document.getElementById('mtSum').textContent = won(lastVal);
			const deltaEl = document.getElementById('mtDelta');
			deltaEl.textContent = (delta >= 0 ? '+' : '') + won(delta) + ' (오늘 증감)';
			deltaEl.style.color = delta >= 0 ? 'var(--good)' : '#ef4444';
	
			const canvas = document.getElementById('chartMonthlyTotal');
			renderChart(
				canvas,
				[
					{
						label: '이달 누적 순변화 (수입 − 지출)',
						data: cumNet,
						borderColor: '#3b82f6',
						backgroundColor: 'rgba(59,130,246,0.15)',
						borderWidth: 3,
						tension: 0.3,
						fill: true,
						pointRadius: 0,
					},
				],
				labels
			);
		}
	

	// --- 이번 달 남은 돈 카드 업데이트 ---
	async function updateBalanceCard() {
		const now = new Date();
		const y = now.getFullYear();
		const m = now.getMonth() + 1;
	
		// 이번 달 데이터 한 번만 호출
		const d = await fetchMonthlySpend(y, m);
	
		// API가 totals를 주면 그걸 쓰고, 없으면 누적 마지막 값을 fallback
		const income   = (d.totalIncome   ?? (d.cumIncome?.at(-1)   || 0)) | 0;
		const spend    = (d.totalSpend    ?? (d.cumSpend?.at(-1)    || 0)) | 0;
		const card     = (d.totalCard     ?? (d.cumCard?.at(-1)     || 0)) | 0;
		const transfer = (d.totalTransfer ?? (d.cumTransfer?.at(-1) || 0)) | 0;
	
		// 페이/기타는 서버에서 오면 사용, 없으면 (총지출 - 카드 - 이체)로 계산
		const otherRaw = (d.totalOther ?? (d.cumOther?.at(-1)));
		const other    = Number.isFinite(otherRaw) ? otherRaw : Math.max(0, spend - card - transfer);
	
		// DOM 반영
		document.getElementById('incomeTotal').textContent   = won(income);
		document.getElementById('expenseTotal').textContent  = won(spend);
		document.getElementById('expenseCard').textContent   = won(card);
		document.getElementById('expenseTransfer').textContent = won(transfer);
		document.getElementById('expenseOther').textContent  = won(other);
	
		const remain = income - spend;
		const el = document.getElementById('remainAmount');
		el.textContent = (remain >= 0 ? '' : '-') + won(Math.abs(remain));
		el.style.color = remain >= 0 ? 'var(--good)' : '#2563eb'; // 파랑(마이너스)
	}
  
  
  

	// ---------- 월간 지출 (이번달 지출 vs 지난달 지출 비교) ----------
		// ---------- 월간 지출 (이번달 지출 vs 지난달 지출 비교) ----------
		async function updateMonthlySpendSection(year = monthYM.year, month = monthYM.month) {
			const { year: py, month: pm } = prevYM(year, month);
	
			setRangeFor('rangeMonthlySpend', year, month);
	
			// 이번달/지난달 각각 요청
			const [
				{ labels: labelsCur = [], cumSpend: cumSpendCur = [] },
				{ labels: labelsPrev = [], cumSpend: cumSpendPrev = [] },
			] = await Promise.all([
				fetchMonthlySpend(year, month),
				fetchMonthlySpend(py, pm),
			]);
	
			// 라벨은 이번달 기준, 지난달 누적은 길이 맞춰 정렬
			const labels = labelsCur;
			const prevAligned = alignToLen(cumSpendPrev, labels.length);
	
			// KPI: 이번달 총 지출 + 지난달 대비 증감
			const curTotal = cumSpendCur.at(-1) || 0;
			const prevSameDay = prevAligned.at(-1) || 0;
			const diff = curTotal - prevSameDay;
	
			document.getElementById('msSum').textContent = `오늘까지 ${won(curTotal)} 썼어요`;
			document.getElementById('msDelta').textContent =
				diff >= 0
					? `지난달보다 ${won(diff)} 더 쓰는 중`
					: `지난달보다 ${won(-diff)} 덜 쓰는 중`;
	
			const canvas = document.getElementById('chartMonthlySpend');
			renderChart(
				canvas,
				[
					{
						label: '이번달 누적 지출',
						data: cumSpendCur,
						borderColor: '#3b82f6',
						backgroundColor: 'rgba(59,130,246,0.15)',
						borderWidth: 3,
						tension: 0.3,
						fill: true,
						pointRadius: 0,
					},
					{
						label: '지난달 누적 지출',
						data: prevAligned,
						borderColor: '#9ca3af',
						backgroundColor: 'rgba(156,163,175,0.12)',
						borderWidth: 2,
						tension: 0.3,
						fill: true,
						pointRadius: 0,
					},
				],
				labels
			);
		}
	

	  

	async function fetchMonthlyCats(year, month) {
		const res = await fetch(`/api/stats/monthly-cats?year=${year}&month=${month}`);
		if (!res.ok) throw new Error('monthly-cats api failed');
		return res.json(); // { total, items:[{category, amount, pct}] }
	}

	async function updateCategoryPills(year = monthYM.year, month = monthYM.month) {
		const wrap = document.getElementById('categoryBreak');
		if (!wrap) return;
		wrap.innerHTML = '';

		try {
			const { items = [] } = await fetchMonthlyCats(year, month);

			if (!items.length) {
				const span = document.createElement('span');
				span.className = 'pill';
				span.textContent = '지출 데이터 없음';
				wrap.appendChild(span);
				return;
			}

			items.forEach(({ category, pct }) => {
				const pill = document.createElement('span');
				pill.className = 'pill';
				pill.textContent = `${category} ${Math.round(pct)}%`;
				wrap.appendChild(pill);
			});
		} catch (e) {
			console.error(e);
			const span = document.createElement('span');
			span.className = 'pill';
			span.textContent = '로드 실패';
			wrap.appendChild(span);
		}
	}

	  
	async function fetchWeekly(n = 10, offset = 0) {
		const res = await fetch(`/api/stats/weekly?n=${n}&offset=${offset}`);
		if (!res.ok) throw new Error('weekly api failed');
		const data = await res.json();
		data.net = (data.net || []).map(v => Number(v) || 0);
		return data;
	}

	  
	async function updateWeeklySection() {
		const n = 10;
		const { labels = [], net = [] } = await fetchWeekly(n, weeklyOffset);

		// KPI
		document.getElementById('wtSum').textContent =
			(Math.round(net.reduce((a, b) => a + b, 0))).toLocaleString('ko-KR') + '원';

		// 차트
		const canvas = document.getElementById('chartWeekly');
		renderChart(
			canvas,
			[
				{
					label: '주간 순변화 (수입 - 지출)',
					data: net,
					borderColor: '#3b82f6',
					backgroundColor: 'rgba(59,130,246,0.15)',
					borderWidth: 3,
					tension: 0.3,
					fill: true,
					pointRadius: 0,
				},
			],
			labels,
			{
				plugins: {
					tooltip: {
						callbacks: {
							label: ctx =>
								(Math.round(ctx.parsed.y)).toLocaleString('ko-KR') + '원',
						},
					},
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: { callback: v => v.toLocaleString('ko-KR') },
					},
				},
			}
		);
	}

	  

	function renderBalance() {
		const inc = state.incomeTotal || 0;
		const exp = state.expense?.total || 0;
		const card = state.expense?.card || 0;
		const transfer = state.expense?.transfer || 0;
		const other = state.expense?.other ?? Math.max(0, exp - card - transfer);
		document.getElementById('incomeTotal').textContent = won(inc);
		document.getElementById('expenseTotal').textContent = won(exp);
		document.getElementById('expenseCard').textContent = won(card);
		document.getElementById('expenseTransfer').textContent = won(transfer);
		document.getElementById('expenseOther').textContent = won(other);
		const remain = inc - exp;
		const el = document.getElementById('remainAmount');
		el.textContent = (remain >= 0 ? '' : '-') + won(Math.abs(remain));
		el.style.color = remain >= 0 ? 'var(--good)' : '#2563eb';
	}

	// ---------- 초기화 ----------
	async function init() {
		bindTabs();
		bindRangeButtons();
		renderBalance();
		await updateMonthlyTotalSection();  
		await updateMonthlySpendSection();  
		await updateWeeklySection(); 
		updateBalanceCard();
		updateCategoryPills();
	}

	if (document.readyState === 'loading')
		document.addEventListener('DOMContentLoaded', init);
	else
		init();

})();
