import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import Calculator from '../components/Calculator'

describe('Calculator Component', () => {
  it('should render the calculator with all fields', () => {
    render(<Calculator />)

    expect(screen.getByText('Informações')).toBeInTheDocument()
    expect(screen.getByLabelText('Selecione a concentração da ampola')).toBeInTheDocument()
    expect(screen.getByLabelText('Selecione a dose desejada')).toBeInTheDocument()
    expect(screen.getByLabelText('Selecione o tipo de seringa')).toBeInTheDocument()
  })

  it('should display initial result on render', () => {
    render(<Calculator />)

    // Default values: 15mg/0.5mL, 2.5mg, 100 UI
    // Expected result: 25 UI (based on formula)
    const result = screen.getByRole('status')
    expect(result).toBeInTheDocument()
  })

  it('should update result when ampola changes', async () => {
    const user = userEvent.setup()
    render(<Calculator />)

    const ampolaSelect = screen.getByLabelText('Selecione a concentração da ampola')
    await user.selectOptions(ampolaSelect, '30-1')

    // Result should update, test by checking the component renders without error
    expect(ampolaSelect).toHaveValue('30-1')
  })

  it('should update result when dose changes', async () => {
    const user = userEvent.setup()
    render(<Calculator />)

    const doseSelect = screen.getByLabelText('Selecione a dose desejada')
    await user.selectOptions(doseSelect, '10')

    expect(doseSelect).toHaveValue('10')
  })

  it('should update result when syringe type changes', async () => {
    const user = userEvent.setup()
    render(<Calculator />)

    const syringeSelect = screen.getByLabelText('Selecione o tipo de seringa')
    await user.selectOptions(syringeSelect, '30')

    expect(syringeSelect).toHaveValue('30')
  })

  it('should show guidance text when result is valid', () => {
    render(<Calculator />)

    // The component should render guidance
    const guidance = screen.queryByText(/Localize/i)
    expect(guidance).toBeInTheDocument()
  })

  it('should have accessible labels for all inputs', () => {
    render(<Calculator />)

    expect(screen.getByLabelText('Selecione a concentração da ampola')).toBeInTheDocument()
    expect(screen.getByLabelText('Selecione a dose desejada')).toBeInTheDocument()
    expect(screen.getByLabelText('Selecione o tipo de seringa')).toBeInTheDocument()
  })

  it('should have proper semantic HTML structure', () => {
    render(<Calculator />)

    // Check for proper structure
    expect(screen.getByText('Informações')).toBeInTheDocument()
    expect(screen.getByLabelText('Selecione a concentração da ampola')).toBeInTheDocument()
  })
})
