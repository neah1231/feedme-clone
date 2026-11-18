import { expect, test } from "@playwright/test";

test("변환 화면이 열리고 URL 입력란과 빈 상태가 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Markdown 변환기");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("웹 페이지를 Markdown으로");
  await expect(page.getByRole("textbox", { name: "변환할 URL" })).toBeVisible();
  await expect(page.getByText("아직 변환한 페이지가 없습니다")).toBeVisible();
});
