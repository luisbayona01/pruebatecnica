import { test, expect } from '@playwright/test';

test.describe('LinkHub E2E', () => {
  test('redirige a login si no hay sesión', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('inicia sesión y llega al dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('demo@linkhub.test').fill('demo@linkhub.test');
    await page.getByPlaceholder('••••••••').fill('password');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('navega a sitios y muestra la lista', async ({ page }) => {
    // login rápido
    await page.goto('/login');
    await page.getByPlaceholder('demo@linkhub.test').fill('demo@linkhub.test');
    await page.getByPlaceholder('••••••••').fill('password');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('link', { name: 'Sitios' }).click();
    await expect(page.getByRole('heading', { name: 'Sitios', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '+ Nuevo sitio' })).toBeVisible();
  });

  test('crea una categoría', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('demo@linkhub.test').fill('demo@linkhub.test');
    await page.getByPlaceholder('••••••••').fill('password');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('link', { name: 'Categorías' }).click();
    await page.getByRole('button', { name: '+ Nueva categoría' }).click();
    await page.getByPlaceholder('Ej. Tecnología').fill('E2E Categoría');
    await page.getByRole('button', { name: 'Crear' }).click();

    await expect(page.getByText('E2E Categoría')).toBeVisible();
  });
});