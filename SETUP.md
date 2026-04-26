# 안전교육 관리 MVP - 설정 가이드

## 1. Supabase 프로젝트 생성

1. https://supabase.com 에서 새 프로젝트 생성
2. Project Settings → API 에서 아래 두 값을 복사

## 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. 데이터베이스 테이블 생성

Supabase Dashboard → SQL Editor에서 아래 파일 내용을 실행:

```
supabase/migrations/001_init.sql
```

## 4. 관리자 계정 생성

Supabase Dashboard → Authentication → Users → Add user

- 이메일 + 비밀번호로 계정 생성
- 이 계정으로 /login 에서 로그인

## 5. 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:3000 접속 → 자동으로 /login 으로 이동

## 6. Vercel 배포

```bash
npx vercel
```

Vercel 환경 변수에 `.env.local`의 두 값 추가

---

## 사용 흐름

1. `/login` → 관리자 로그인
2. `/employees/new` → 직원 등록
3. `/trainings/new` → 교육 생성 (내용 + O/X 퀴즈 3개)
4. `/trainings/[id]` → 직원별 교육 링크 생성 후 복사
5. 직원에게 링크 전달 (카카오톡, 문자 등)
6. 직원은 링크 접속 → 교육 내용 확인 → 퀴즈 → 전자서명 → 제출
7. `/reports` → PDF 다운로드
