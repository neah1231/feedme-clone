# 웹 페이지 본문 추출

## Decisions

- 웹 페이지 본문은 `defuddle`로 추출합니다. 서버에서 `defuddle/node`와 `linkedom` 조합으로 제목, 저자, 사이트, 게시일, 단어 수, Markdown 본문을 얻습니다.
- 페이지를 가져와 변환하는 일은 브라우저가 아니라 서버(`POST /api/convert`)에서 합니다.
- 오류는 세 가지로 나눠 보여 줍니다. URL 형식이 아님, 페이지를 가져오지 못함, 본문을 추출하지 못함입니다. 서버가 받은 HTML에 본문이 없으면 추출 실패로 처리합니다.

## Boundaries

- JavaScript로만 본문을 그리는 페이지나 로그인이 필요한 페이지의 추출은 보장하지 않습니다. 헤드리스 렌더링을 붙이자는 결정이 아닙니다.

## Why

`defuddle`은 요구 사항이 정한 라이브러리입니다. 브라우저는 CORS 때문에 다른 사이트의 HTML을 직접 가져올 수 없으므로 서버에서 가져와야 합니다.

## Evidence worth preserving

- `defuddle` 0.19.6에서 `defuddle/node` + `linkedom` 조합으로 `https://stephango.com/file-over-app`의 제목 "File over app", 저자 "Steph Ango", 게시일, Markdown 본문이 추출되는 것을 확인했습니다. 로컬과 Vercel 배포 모두에서 같습니다.
