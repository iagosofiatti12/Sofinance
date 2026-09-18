/**
 * 🚀 GUIA DE USO - QUICK WINS UX IMPLEMENTADAS
 * 
 * Este arquivo demonstra como usar as novas funcionalidades:
 * 1. ✅ Máscaras de input para valores monetários
 * 2. ✅ Validação em tempo real nos forms
 * 3. ✅ Hover states mais evidentes (automático no CSS)
 * 4. ✅ Loading states nos botões
 */

import React, { useState } from 'react'
import LoadingButton from '../components/UI/LoadingButton'
import { useFormInput, validators } from '../hooks/useFormInput'
import { useCurrencyInputV2 } from '../utils/currency'
import { Save, Trash2 } from 'lucide-react'

// ==================== EXEMPLO 1: LOADING BUTTON ====================

const ExemploLoadingButton = () => {
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    
    // Simular operação assíncrona (ex: salvar no banco)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setLoading(false)
  }

  return (
    <div>
      {/* Botão com loading automático */}
      <LoadingButton 
        loading={loading}
        onClick={handleSave}
        variant="primary"
        icon={Save}
      >
        Salvar Alterações
      </LoadingButton>

      {/* Botão de perigo */}
      <LoadingButton 
        loading={loading}
        onClick={handleSave}
        variant="danger"
        icon={Trash2}
      >
        Excluir
      </LoadingButton>
    </div>
  )
}

// ==================== EXEMPLO 2: VALIDAÇÃO EM TEMPO REAL ====================

const ExemploValidacao = () => {
  // Input com validação de email
  const email = useFormInput('', validators.email())
  
  // Input com múltiplas validações combinadas
  const nome = useFormInput('', validators.combine(
    validators.required('Nome é obrigatório'),
    validators.minLength(3, 'Nome deve ter no mínimo 3 caracteres'),
    validators.maxLength(50, 'Nome muito longo')
  ))

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Força validação de todos os campos
    const emailValid = email.validate()
    const nomeValid = nome.validate()
    
    if (emailValid && nomeValid) {
      console.log('Formulário válido!', {
        email: email.value,
        nome: nome.value
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Espalha props do input automaticamente */}
      <div>
        <label>Nome *</label>
        <input {...nome.inputProps} placeholder="Seu nome completo" />
        {nome.touched && nome.error && (
          <span className="error-message">{nome.error}</span>
        )}
      </div>

      <div>
        <label>Email</label>
        <input 
          type="email"
          {...email.inputProps} 
          placeholder="seu@email.com" 
        />
        {email.touched && email.error && (
          <span className="error-message">{email.error}</span>
        )}
      </div>

      <button type="submit">Enviar</button>
    </form>
  )
}

// ==================== EXEMPLO 3: INPUT MONETÁRIO ====================

const ExemploInputMonetario = () => {
  const [valorConta, setValorConta] = useState(0)
  
  // Hook que gerencia formatação automática
  const valor = useCurrencyInputV2(0, (numericValue) => {
    setValorConta(numericValue)
    console.log('Valor numérico:', numericValue)
  })

  const handleSave = () => {
    // valor.numericValue já está pronto para salvar no banco
    console.log('Salvar valor:', valor.numericValue)
  }

  return (
    <div>
      <label>Valor da Conta</label>
      
      {/* Opção 1: Espalhar props */}
      <input {...valor.inputProps} />
      
      {/* Opção 2: Manual */}
      <input 
        type="text"
        value={valor.value}
        onChange={valor.onChange}
        placeholder="R$ 0,00"
        inputMode="numeric"
      />
      
      {/* Valor exibido: R$ 1.234,56 */}
      <p>Formatado: {valor.value}</p>
      
      {/* Valor real para salvar: 1234.56 */}
      <p>Numérico: {valor.numericValue}</p>

      <button onClick={handleSave}>Salvar</button>
    </div>
  )
}

// ==================== EXEMPLO 4: FORMULÁRIO COMPLETO ====================

const FormularioCompleto = () => {
  const [loading, setLoading] = useState(false)
  
  // Validações
  const nome = useFormInput('', validators.combine(
    validators.required(),
    validators.minLength(3)
  ))
  
  const valor = useCurrencyInputV2(0)
  
  const dia = useFormInput('', validators.combine(
    validators.required(),
    validators.min(1, 'Dia mínimo: 1'),
    validators.max(31, 'Dia máximo: 31')
  ))

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar tudo
    if (!nome.validate() || !dia.validate() || valor.numericValue === 0) {
      alert('Preencha todos os campos corretamente')
      return
    }

    setLoading(true)
    
    try {
      // Dados prontos para salvar
      const dados = {
        nome: nome.value,
        valor: valor.numericValue,
        dia_vencimento: parseInt(dia.value)
      }
      
      console.log('Salvando:', dados)
      // await salvarConta(dados)
      
      alert('Salvo com sucesso!')
    } catch (error) {
      alert('Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card">
      <h2>Nova Conta Fixa</h2>
      
      <div>
        <label>Nome da Conta *</label>
        <input {...nome.inputProps} placeholder="Ex: Aluguel" />
        {nome.error && <span className="error-message">{nome.error}</span>}
      </div>

      <div>
        <label>Valor *</label>
        <input {...valor.inputProps} />
      </div>

      <div>
        <label>Dia do Vencimento *</label>
        <input 
          {...dia.inputProps}
          type="number"
          min="1"
          max="31"
          placeholder="1-31"
        />
        {dia.error && <span className="error-message">{dia.error}</span>}
      </div>

      <LoadingButton 
        type="submit"
        loading={loading}
        variant="primary"
        icon={Save}
      >
        Salvar Conta
      </LoadingButton>
    </form>
  )
}

// ==================== VALIDADORES DISPONÍVEIS ====================

/*
validators.required(message?)
validators.minLength(min, message?)
validators.maxLength(max, message?)
validators.email(message?)
validators.number(message?)
validators.min(min, message?)
validators.max(max, message?)
validators.combine(...validators) // Combinar múltiplos

Exemplo:
validators.combine(
  validators.required('Campo obrigatório'),
  validators.minLength(3),
  validators.maxLength(100)
)
*/

export {
  ExemploLoadingButton,
  ExemploValidacao,
  ExemploInputMonetario,
  FormularioCompleto
}
