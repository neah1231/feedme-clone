# .md 다운로드가 일부 브라우저에서 파일 없이 끝날 수 있음

**Symptom**: `code-review low`가 `features/export/export-toolbar.tsx`의 `download()`에서 `a.click()` 직후 `URL.revokeObjectURL(url)`을 바로 호출한다고 지적했습니다. 다운로드를 비동기로 시작하는 브라우저에서는 파일이 저장되기 전에 URL이 해제될 수 있습니다.

**Observed evidence**: Chrome 157(agent-browser, `http://localhost:3301`)에서는 재현되지 않았습니다. `https://stephango.com/file-over-app` 변환 후 다운로드하면 `File-over-app.md`(2,227자)가 정상으로 만들어졌습니다. Firefox·Safari에서는 확인하지 않았습니다.

**Suspected cause**: 해제 시점이 다운로드 시작보다 앞설 수 있음(추정).

**What was tried**: 아무것도 바꾸지 않았습니다. 학습 템플릿 검증 예산상 재현되지 않은 지적은 기록만 합니다.

**Proposed next step**: Firefox에서 같은 흐름을 돌려 재현되면 `URL.revokeObjectURL`을 `setTimeout(..., 0)` 뒤로 미룹니다.
