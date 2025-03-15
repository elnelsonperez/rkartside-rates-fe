import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import axios from 'axios';
import { QuoteResponse } from './types';

// Mock axios
vi.mock('axios');

// Type assertion for mocked functions
const mockedAxios = axios as unknown as {
  post: ReturnType<typeof vi.fn>;
};

describe('App', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders the quoting form', () => {
    render(<App />);
    
    // Check that the title is present (using regex for flexibility)
    expect(screen.getByText(/Cotizador de Servicios/)).toBeInTheDocument();
    
    // Check form fields are present
    expect(screen.getByLabelText('Número de espacios a decorar')).toBeInTheDocument();
    expect(screen.getByLabelText('Monto total de venta (DOP)')).toBeInTheDocument();
    
    // Check submit button is present
    expect(screen.getByRole('button', { name: 'Cotizar' })).toBeInTheDocument();
  });

  it('submits the form and displays the quote result', async () => {
    // Mock successful API response
    const mockResponse: { data: QuoteResponse } = { 
      data: { rate: 5000 } 
    };
    
    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    render(<App />);
    
    // Fill the form
    const spacesInput = screen.getByLabelText('Número de espacios a decorar') as HTMLInputElement;
    const saleAmountInput = screen.getByLabelText('Monto total de venta (DOP)') as HTMLInputElement;
    
    fireEvent.change(spacesInput, { target: { value: '3' } });
    fireEvent.change(saleAmountInput, { target: { value: '50000' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Cotizar' });
    fireEvent.click(submitButton);
    
    // Check loading state
    expect(submitButton.textContent).toBe('Procesando...');
    
    // Check axios was called with the correct parameters
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('https://api.example.com/quote', {
        store_id: '1',
        number_of_spaces: 3,
        sale_amount: 50000
      });
    });
    
    // Check result is displayed
    await waitFor(() => {
      expect(screen.getByText('Resultado de la Cotización')).toBeInTheDocument();
      expect(screen.getByText(/Tarifa calculada:/)).toBeInTheDocument();
      // Check the formatted currency value (might need adjustment based on locale behavior)
      expect(screen.getByText(/RD\$\s*5,000.00/)).toBeInTheDocument();
    });
  });

  it('displays an error message when API call fails', async () => {
    // Mock API error
    mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));
    
    render(<App />);
    
    // Fill the form
    const spacesInput = screen.getByLabelText('Número de espacios a decorar') as HTMLInputElement;
    const saleAmountInput = screen.getByLabelText('Monto total de venta (DOP)') as HTMLInputElement;
    
    fireEvent.change(spacesInput, { target: { value: '2' } });
    fireEvent.change(saleAmountInput, { target: { value: '10000' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Cotizar' });
    fireEvent.click(submitButton);
    
    // Check error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Error al obtener la cotización. Por favor, intente de nuevo.')).toBeInTheDocument();
    });
  });
});