import { render, screen, fireEvent } from '@testing-library/react';
import ContasFixasList from './ContasFixasList';

test('form submission and saving account', async () => {
    render(<ContasFixasList />);

    const createButton = screen.getByText(/criar/i);
    fireEvent.click(createButton);

    const inputField = screen.getByPlaceholderText(/preencha as informações/i);
    fireEvent.change(inputField, { target: { value: 'Nova Conta' } });

    const saveButton = screen.getByText(/salvar/i);
    fireEvent.click(saveButton);

    const successMessage = await screen.findByText(/conta criada com sucesso/i);
    expect(successMessage).toBeInTheDocument();
});