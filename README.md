# 📅 Schedule App

URL 기반 일정 자동 수집 및 관리 웹 애플리케이션입니다. YouTube 링크나 웹 페이지 URL을 입력하면 Claude AI가 자동으로 제목과 요약을 추출하여 일정으로 등록해줍니다.

🔗 **라이브 데모:** [schedule-app-v2-khaki.vercel.app](https://schedule-app-v2-khaki.vercel.app)

---

## ✨ 주요 기능

- **URL 자동 임포트** — YouTube 또는 웹 페이지 URL 입력 시 Claude AI로 제목·요약 자동 추출
- **일정 관리** — 일정 생성, 수정, 삭제 (카테고리 및 태그 분류 지원)
- **캘린더 뷰** — 월별 캘린더로 일정 시각화
- **대시보드** — 최근 일정 카드 형태로 빠르게 확인
- **멀티유저 지원** — 회원가입 / 로그인 / 로그아웃
- **API 토큰 인증** — 외부 API 접근을 위한 토큰 기반 인증
- **Telegram 연동** — Telegram URL을 통한 일정 자동 생성

---

## 🛠 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | [Next.js](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite (로컬) / PostgreSQL (Vercel 프로덕션) |
| ORM | Prisma |
| AI | Claude API (Anthropic) |
| Deployment | Vercel |

---

## 📁 프로젝트 구조

```
schedule-app/
├── prisma/          # Prisma 스키마 및 마이그레이션
├── public/          # 정적 파일
├── src/
│   ├── app/         # Next.js App Router 페이지
│   │   ├── api/         # API 라우트
│   │   ├── calendar/    # 캘린더 페이지
│   │   ├── categories/  # 카테고리 관리
│   │   ├── login/       # 로그인
│   │   ├── register/    # 회원가입
│   │   ├── schedules/   # 일정 목록/상세
│   │   ├── settings/    # 설정 (API 토큰 등)
│   │   └── tags/        # 태그 관리
│   ├── components/  # 공통 컴포넌트
│   └── lib/         # 유틸리티 및 DB 클라이언트
├── auth.ts          # 인증 설정
└── proxy.ts         # API 프록시
```

---

## 🚀 로컬 실행 방법

### 1. 저장소 클론

```bash
git clone https://github.com/wwhunter14-wwhunter/schedule-app.git
cd schedule-app
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 아래 내용을 입력하세요:

```env
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="your_claude_api_key"
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. 데이터베이스 초기화

```bash
npx prisma migrate dev
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 📦 배포 (Vercel)

Vercel에 배포 시 `vercel.json` 설정이 적용됩니다. 프로덕션 환경에서는 PostgreSQL(Neon 등)을 사용하는 것을 권장합니다.

환경 변수는 Vercel 대시보드 → Settings → Environment Variables에서 설정하세요.

---

## 📄 라이선스

MIT License
