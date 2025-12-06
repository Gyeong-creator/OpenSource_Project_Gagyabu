# 💸 가계부 웹 사이트 💸

## 📢 프로젝트 소개
수입과 지출을 기록하고, 차트로 소비 패턴을 분석하는 간단한 가계부 웹사이트입니다.

## 💡 기획 의도
이 프로젝트는 **수입/지출 기록**과 **소비 패턴 시각화**라는 핵심 기능에 집중한, 간단하고 직관적인 웹 가계부를 목표로 개발되었습니다.  
사용자가 자신의 재정 상태를 한눈에 파악하고 재정 관리를 쉽게 시작할 수 있도록 돕고자 합니다.

<br>

## 📖 가계부 사용법

### 1. 로그인 및 회원가입
- ID와 비밀번호 입력 후 로그인합니다.<br>
- 계정이 없다면, '회원가입 하기' 버튼을 클릭하여 가입할 수 있습니다.
- 회원가입은 이름, ID, 비밀번호(8자리 이상)를 입력하여 가입할 수 있습니다.

<table width="100%">
  <tr>
    <th width="50%">로그인</th>
    <th width="50%">회원가입</th>
  </tr>
  <tr>
    <td align="center" valign="top">
      <img src="https://github.com/user-attachments/assets/e00c8a0c-c69e-4338-9829-b80300516838" width="100%">
    </td>
    <td align="center" valign="top">
      <img src="https://github.com/user-attachments/assets/60f79aa3-9093-4e7c-a370-bcb28d719b42" width="100%">
    </td>
  </tr>
</table>
<br>

### 2. 입금·출금 내역 확인 (메인)
- 달력을 통해 날짜별 내역을 한눈에 볼 수 있습니다.
- 오늘 날짜 칸에 색이 칠해져 있습니다.
- 내역이 등록된 날짜는 색깔이 변하여 직관적으로 확인 가능합니다.

<img src="https://github.com/user-attachments/assets/dbfdc845-fc8f-4af6-9579-811d75010c13" width="100%">
<img width="1078" height="519" alt="image" src="https://github.com/user-attachments/assets/c4bd1e9c-24c0-4844-9d44-5cbbaec7b23e" width="100%">


<br>

### 3. 내역 등록
- 날짜를 클릭 후 수입/지출 내역을 등록할 수 있습니다.
- 유형(입금/출금), 카테고리, 지불수단, 내역, 금액을 입력합니다.

<table>
  <tr>
    <th width="25%">1. 입/출금 선택</th>
    <th width="25%">2. 카테고리 선택</th>
    <th width="25%">3. 지불수단 선택(출금)</th>
    <th width="25%">4. 내역과 금액 입력</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/ae3e9188-e183-4406-99bc-ace8cbb61a39" width="100%"></td>
    <td><img src="https://github.com/user-attachments/assets/331e86f0-cf67-4417-9b9c-7db2b6f74c42" width="100%"></td>
    <td><img src="https://github.com/user-attachments/assets/b22eef59-9353-45fb-9a43-92359dd77c3f" width="100%"></td>
    <td><img src="https://github.com/user-attachments/assets/21790bce-92f2-4b8a-8fc0-e36caf494d1c" width="100%"></td>
  </tr>
</table>

<br>

**[등록된 내역 수정 및 삭제]**
- 연필 아이콘을 클릭하면 내역을 수정할 수 있습니다.
- X 아이콘을 누르면 내역을 삭제할 수 있습니다.

<img src="https://github.com/user-attachments/assets/8963dd7a-d898-4ad2-b0be-57ad8eabc2f5" width="100%">
<img width="992" height="257" alt="image" src="https://github.com/user-attachments/assets/4482dfa5-db34-4c5f-bfa8-e94fe418efe2" width="100%">


<br>

### 4. 통계 (Statistics)
- 월간 합계 통계를 제공합니다.
- 월간/주간 수입 및 지출 합계를 제공합니다.
- 카테고리별 지출 비중을 확인할 수 있습니다.

<img src="https://github.com/user-attachments/assets/0fc42aeb-0fa9-4c29-8acf-2f6f6ebb5d22" width="80%"><img src="https://github.com/user-attachments/assets/611897d6-da5b-46db-9fcd-d0fa70b1d8f9" width="80%">

<br>
<br>


<img src="https://github.com/user-attachments/assets/a697261f-7991-43a8-b621-f006ca45001d" width="80%"><img src="https://github.com/user-attachments/assets/d69c7387-2592-4a40-a3a1-f2f99f0a9c1a" width="80%">

<br>
<br>


<img src="https://github.com/user-attachments/assets/44ac549b-e534-4e05-97b6-480adeb9d5f7" width="80%">

<br>
<br>

**[지출 경고 알림]**

- 지난달 예산 대비 이번 달 지출이 일정 수준을 넘으면 경고 메시지를 띄웁니다.
<img src="https://github.com/user-attachments/assets/ab280023-25ab-469d-a321-a9dc47293946" width="100%">

<br>
<br>

### ✨Tech Stacks✨
<div>
  <img src="https://img.shields.io/badge/python-3776AB?style=for-the-badge&logo=python&logoColor=white">
  <img src="https://img.shields.io/badge/flask-3BABC3?style=for-the-badge&logo=flask&logoColor=white">
  <img src="https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white">

  <img src="https://img.shields.io/badge/javascript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/html5-E34F26?style=for-the-badge&logo=html5&logoColor=white">
  <img src="https://img.shields.io/badge/css3-1572B6?style=for-the-badge&logo=css3&logoColor=white">
</div>
</div>

### ✨Collaboration Tools✨
<div>
  <img src="https://img.shields.io/badge/github-181717?style=for-the-badge&logo=github&logoColor=white">
  <img src="https://img.shields.io/badge/git-F05032?style=for-the-badge&logo=git&logoColor=white">
</div>


<br>
<br>

## 🙂 기여자

<table>
  <tr>
    <th>김경렬</th>
    <th>강지연</th>
    <th>정유빈</th>
  </tr>
  <tr>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/Gyeong-creator" width="100" />
    </td>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/GangJiyeon" width="100" />
    </td>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/yubin623" width="100" />
    </td>
  </tr>
  <tr>
    <td align="center"><span style="color:lightgray;">리더, 기여자, 사용자</span></td>
    <td align="center"><span style="color:lightgray;">메인테이너, 기여자, 사용자</span></td>
    <td align="center"><span style="color:lightgray;">커미터, 기여자, 사용자</span></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/Gyeong-creator">@Gyeong-creator</a></td>
    <td align="center"><a href="https://github.com/GangJiyeon">@GangJiyeon</a></td>
    <td align="center"><a href="https://github.com/yubin623">@yubin623</a></td>
  </tr>
</table>

