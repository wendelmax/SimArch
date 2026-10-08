import { expect, test } from '@playwright/test'

test.describe('SimArch startup', () => {
  test('renders the architecture workspace', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('h1.model-title')).toHaveText('Architecture')
    await expect(page.getByRole('button', { name: 'Exemplos' })).toBeVisible()
    await expect(page.locator('.palette-title')).toHaveText('Componentes')
  })

  test('opens the examples menu and shows a selectable model', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Exemplos' }).click()

    const examplesMenu = page.locator('.dropdown-menu-examples')
    await expect(examplesMenu.getByText('Generico', { exact: true })).toBeVisible()
    await expect(examplesMenu.getByRole('button', { name: 'E-commerce Order e Pagamento' })).toBeVisible()
  })
})
