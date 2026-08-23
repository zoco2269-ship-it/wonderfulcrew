# 무료 라이브 완주자 전자책 자동 발송

라이브를 끝까지 본 사람에게만 "합격 비법 전자책"을 자동으로 주는 기능. 코드는 대표님이 라이브 마지막에 직접 공개하고, 참석자는 사이트에서 코드를 입력해 즉시 다운로드 + 이메일을 받는다.

## 처음 한 번만 할 일

1. **Supabase 테이블 생성** — `supabase-schema.sql`의 9, 10번 항목(`ebook_config`, `ebook_unlocks`)을 Supabase SQL Editor에서 실행.
2. **환경변수 확인** — 이미 있는 값 그대로 재사용됨. 새로 추가할 건 없음.
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (DB)
   - `RESEND_API_KEY`, `EMAIL_DOMAIN_VERIFIED=1`, `FROM_EMAIL` (자동 발송 메일 — 도메인 인증 전이면 이메일은 생략되고 화면 다운로드만 됨)
   - `PUSH_ADMIN_KEY` (관리자 페이지 인증, 기본값 `wc-push-admin-2026`)

## 라이브 할 때마다 할 일

1. 전자책 PDF를 Supabase Storage `wonderfulcrew` 버킷(이미 공개 버킷)의 `ebooks/` 폴더에 업로드하고 공개 URL 복사.
2. `wonderfulcrew.com/admin-ebook.html` 접속 → 이번 라이브용 **코드**, **PDF 링크**, **제목** 입력 후 저장.
3. 라이브 진행 → 마지막에 코드를 화면/채팅으로 공개.
4. 참석자는 `wonderfulcrew.com/ebook.html`에서 이름/연락처/이메일/코드 입력 → 통과 시 바로 다운로드 버튼 노출 + 같은 링크가 이메일로도 자동 발송.
5. 다음 라이브 전에 코드만 새로 바꿔서 저장하면 이전 코드는 자동으로 무효화됨(항상 최신 1개만 유효).

## 발급 현황 확인

`admin-ebook.html`에서 "불러오기"를 누르면 지금까지 총 발급 건수가 보임. 개별 발급자 목록(이름/연락처/이메일)이 필요하면 Supabase 대시보드에서 `ebook_unlocks` 테이블을 조회.

## 아직 안 된 것

- 전자책 PDF 파일 자체 (지금은 뼈대만 있고 콘텐츠 없음 — 만들어지면 Storage에 올리고 admin-ebook.html에 링크만 넣으면 끝)
- `seminar_signups`(무료 라이브 신청자 명단)와의 대조는 넣지 않음 — 코드 자체가 "라이브를 실제로 본 사람만 아는 정보"라 별도 명단 대조 없이도 스팸 방지가 됨. 필요해지면 추가 가능.
