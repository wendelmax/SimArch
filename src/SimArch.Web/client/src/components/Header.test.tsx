import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Header } from './Header'

function renderHeader(onLoadExample = vi.fn()) {
  return {
    onLoadExample,
    ...render(
      <Header
        modelName="Architecture"
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onLoadExample={onLoadExample}
        onSave={vi.fn()}
        onExport={vi.fn()}
        onToggleLeftPanel={vi.fn()}
        showLeftPanel
        onTogglePanel={vi.fn()}
        showPanel
        onToggleBottomPanel={vi.fn()}
        showBottomPanel
      />
    ),
  }
}

describe('Header examples menu', () => {
  it('opens the examples menu and exposes grouped projects', () => {
    renderHeader()

    fireEvent.click(screen.getByRole('button', { name: /Exemplos/i }))

    expect(screen.getByText('Generico')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /E-commerce Order/i })).toBeInTheDocument()
  })

  it('loads the selected example and closes the menu', () => {
    const { onLoadExample } = renderHeader()

    fireEvent.click(screen.getByRole('button', { name: /Exemplos/i }))
    const example = screen.getByRole('button', { name: /E-commerce Order/i })
    fireEvent.click(example)

    expect(onLoadExample).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: /Exemplos/i })).toHaveAttribute('aria-expanded', 'false')
  })
})
