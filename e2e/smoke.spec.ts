import { expect, test } from '@playwright/test';

// The few things that must always work on the live site.

test('the English page loads', async ({ page }) => {
	await page.goto('./');
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'About me' })).toBeAttached();
});

test('the Turkish page loads', async ({ page }) => {
	await page.goto('tr/');
	await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
	await expect(page.getByRole('heading', { name: 'Hakkımda' })).toBeAttached();
});

test('switching language keeps the section you are reading', async ({ page }) => {
	await page.goto('./');
	await page.locator('#about').scrollIntoViewIfNeeded();
	await page.locator('#about h2').evaluate((el) => el.scrollIntoView({ block: 'center' }));
	await page.getByRole('link', { name: 'TR' }).click();
	await expect(page).toHaveURL(/\/portfolio\/tr\/#about$/);
	await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
});

test('a project star can be reached with the keyboard and shows its card', async ({ page }) => {
	await page.goto('./');
	const star = page.locator('.chart .star').first();
	await star.focus();
	await expect(star).toBeFocused();
	const card = page.locator('.chart__item').first().locator('.card');
	await expect(card).toBeVisible();
	await expect(card.getByRole('link', { name: 'Code' })).toBeVisible();
});

test('the CV button downloads the PDF', async ({ page, request }) => {
	await page.goto('./');
	const cv = page.getByRole('link', { name: 'Download CV (PDF)' });
	await expect(cv).toHaveAttribute('href', /cv\.pdf$/);
	const response = await request.get(await cv.getAttribute('href') as string);
	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toContain('pdf');
});

test('the name can be selected while visible, but not once it has faded away', async ({ page }) => {
	await page.goto('./');
	const name = page.getByRole('heading', { level: 1 });
	await expect(name).toHaveCSS('user-select', 'auto');
	const scene = await page.evaluate(() => document.documentElement.classList.contains('webgl'));
	test.skip(!scene, 'The fade comes from the 3D scene, which needs WebGL');
	await page.waitForFunction(() => document.documentElement.classList.contains('scene-ready'));
	// Halfway through the departure: the name has fully faded by 30%.
	await page.evaluate(() => {
		const hero = document.querySelector<HTMLElement>('.hero')!;
		window.scrollTo({ top: (hero.offsetHeight - innerHeight) * 0.5, behavior: 'instant' });
	});
	await expect(name).toHaveCSS('user-select', 'none');
	await expect(name).toHaveCSS('pointer-events', 'none');
	// Still a heading for screen readers.
	await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
});

test('the page loads without errors', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
	await page.goto('./');
	await page.waitForLoadState('networkidle');
	expect(errors).toEqual([]);
});
