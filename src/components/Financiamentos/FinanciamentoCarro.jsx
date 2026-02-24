import React, { useState, useEffect } from 'react'
import { Car, Save, TrendingDown, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import EmptyState from '../EmptyState'
import { getFinanciamentoCarro, saveFinanciamentoCarro } from '../../services/financiamentosService'
import { getUserId } from '../../services/supabaseClient'
import { formatCurrency } from '../../utils/currency'
import { financiamentoCarroSchema, validateData, getValidationErrorMessage } from '../../utils/validations'
import { getErrorMessage } from '../../utils/errorHandler'
import './Financiamentos.css'

const FinanciamentoCarro = () => {
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [financiamento, setFinanciamento] = useState(null)
  const [formData, setFormData] = useState({
    modelo_carro: '',
    valor_total: '',
    valor_entrada: '',
    valor_financiado: '',
    taxa_juros: '',
    num_parcelas: '',
    parcela_valor: '',
    parcelas_pagas: 0,
    data_inicio: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadFinanciamento()
  }, [])

  const loadFinanciamento = async () => {
    try {
      setLoading(true)
      const data = await getFinanciamentoCarro()
      if (data) {
        setFinanciamento(data)
        setFormData(data)
        setEditing(false)
      } else {
        setEditing(true)
      }
    } catch (error) {
      console.error('Erro ao carregar financiamento:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const userId = await getUserId()
      
      // Preparar dados para validação
      const dataToValidate = {
        modelo_carro: formData.modelo_carro,
        valor_total: parseFloat(formData.valor_total),
        valor_entrada: parseFloat(formData.valor_entrada),
        valor_financiado: parseFloat(formData.valor_financiado),
        taxa_juros: parseFloat(formData.taxa_juros),
        num_parcelas: parseInt(formData.num_parcelas),
        parcela_valor: parseFloat(formData.parcela_valor),
        parcelas_pagas: parseInt(formData.parcelas_pagas || 0),
        data_inicio: formData.data_inicio
      }
      
      // Validar com Zod
      const validation = validateData(financiamentoCarroSchema, dataToValidate)
      if (!validation.success) {
        toast.error(getValidationErrorMessage(validation.errors))
        return
      }

      await saveFinanciamentoCarro({ ...validation.data, user_id: userId })
      await loadFinanciamento()
      toast.success('Financiamento salvo com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar financiamento:', error)
      const errorMsg = getErrorMessage(error)
      toast.error(errorMsg)
    }
  }

  const calcularSaldoDevedor = () => {
    if (!financiamento) return 0
    const parcelasRestantes = financiamento.num_parcelas - financiamento.parcelas_pagas
    return parcelasRestantes * financiamento.parcela_valor
  }

  const calcularProgresso = () => {
    if (!financiamento) return 0
    return ((financiamento.parcelas_pagas / financiamento.num_parcelas) * 100).toFixed(1)
  }

  const calcularTotalPago = () => {
    if (!financiamento) return 0
    return financiamento.parcelas_pagas * financiamento.parcela_valor
  }

  if (loading) {
    return (
      <div className="loading-container">
        <img src="/loading-icon.gif" alt="Carregando..." className="loading-icon" />
        <p>Carregando financiamento...</p>
      </div>
    )
  }

  // Mostrar empty state se não houver financiamento e não estiver editando
  if (!financiamento && !editing) {
    return (
      <div className="financiamento-container">
        <EmptyState
          icon={Car}
          title="Nenhum Financiamento Cadastrado"
          message="Você ainda não cadastrou seu financiamento de veículo. Adicione os dados para acompanhar o progresso."
          actionLabel="Cadastrar Financiamento"
          onAction={() => setEditing(true)}
        />
      </div>
    )
  }

  return (
    <div className="financiamento-container">
      <div className="financiamento-header">
        <div className="title-section">
          <Car size={32} />
          <div>
            <h2>Financiamento de Veículo</h2>
            <p>Acompanhe o progresso do seu carro</p>
          </div>
        </div>
        {financiamento && !editing && (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            Editar Dados
          </button>
        )}
      </div>

      {editing ? (
        <div className="glass-card">
          <h3>Dados do Financiamento</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Modelo do Carro *</label>
              <input
                type="text"
                value={formData.modelo_carro}
                onChange={(e) => setFormData({ ...formData, modelo_carro: e.target.value })}
                placeholder="Ex: Honda Civic 2023"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Valor Total (R$) *</label>
                <input
                  type="text"
                  value={formData.valor_total ? formatCurrency(parseFloat(formData.valor_total) * 100) : ''}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, '')
                    const numero = Number(valor) / 100
                    setFormData({ ...formData, valor_total: numero || '' })
                  }}
                  placeholder="R$ 0,00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Valor da Entrada (R$) *</label>
                <input
                  type="text"
                  value={formData.valor_entrada ? formatCurrency(parseFloat(formData.valor_entrada) * 100) : ''}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, '')
                    const numero = Number(valor) / 100
                    setFormData({ ...formData, valor_entrada: numero || '' })
                  }}
                  placeholder="R$ 0,00"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Valor Financiado (R$) *</label>
                <input
                  type="text"
                  value={formData.valor_financiado ? formatCurrency(parseFloat(formData.valor_financiado) * 100) : ''}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, '')
                    const numero = Number(valor) / 100
                    setFormData({ ...formData, valor_financiado: numero || '' })
                  }}
                  placeholder="R$ 0,00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Taxa de Juros (% a.a.) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.taxa_juros}
                  onChange={(e) => setFormData({ ...formData, taxa_juros: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Número de Parcelas *</label>
                <input
                  type="number"
                  value={formData.num_parcelas}
                  onChange={(e) => setFormData({ ...formData, num_parcelas: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Valor da Parcela (R$) *</label>
                <input
                  type="text"
                  value={formData.parcela_valor ? formatCurrency(parseFloat(formData.parcela_valor) * 100) : ''}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, '')
                    const numero = Number(valor) / 100
                    setFormData({ ...formData, parcela_valor: numero || '' })
                  }}
                  placeholder="R$ 0,00"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Parcelas Já Pagas</label>
                <input
                  type="number"
                  value={formData.parcelas_pagas}
                  onChange={(e) => setFormData({ ...formData, parcelas_pagas: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Data de Início *</label>
                <input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              {financiamento && (
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="btn btn-success">
                <Save size={18} />
                Salvar Financiamento
              </button>
            </div>
          </form>
        </div>
      ) : financiamento ? (
        <div className="financiamento-overview">
          {/* Modelo do Carro */}
          <div className="glass-card modelo-card">
            <Car size={48} color="var(--accent-blue)" />
            <div>
              <h3>{financiamento.modelo_carro}</h3>
              <p className="text-muted">Seu veículo financiado</p>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="stats-grid">
            <div className="stat-card glass-card">
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                <Car size={24} color="var(--accent-blue)" />
              </div>
              <div className="stat-content">
                <span className="stat-label">Valor Total</span>
                <span className="stat-value">
                  R$ {parseFloat(financiamento.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="stat-card glass-card">
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                <TrendingDown size={24} color="var(--accent-red)" />
              </div>
              <div className="stat-content">
                <span className="stat-label">Saldo Devedor</span>
                <span className="stat-value" style={{ color: 'var(--accent-red)' }}>
                  R$ {calcularSaldoDevedor().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="stat-card glass-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                <Calendar size={24} color="var(--accent-green)" />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total Pago</span>
                <span className="stat-value" style={{ color: 'var(--accent-green)' }}>
                  R$ {calcularTotalPago().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="stat-card glass-card">
              <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                <Save size={24} color="var(--accent-purple)" />
              </div>
              <div className="stat-content">
                <span className="stat-label">Valor da Parcela</span>
                <span className="stat-value">
                  R$ {parseFloat(financiamento.parcela_valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Progresso */}
          <div className="glass-card">
            <h3>Progresso do Financiamento</h3>
            <div className="progress-section">
              <div className="progress-info">
                <div className="progress-item">
                  <span className="label">Parcelas Pagas</span>
                  <span className="value">{financiamento.parcelas_pagas} de {financiamento.num_parcelas}</span>
                </div>
                <div className="progress-item">
                  <span className="label">Progresso</span>
                  <span className="value">{calcularProgresso()}%</span>
                </div>
              </div>
              <div className="progress-bar large">
                <div 
                  className="progress-fill" 
                  style={{ width: `${calcularProgresso()}%` }}
                />
              </div>
            </div>
          </div>

          {/* Detalhes */}
          <div className="glass-card">
            <h3>Detalhes</h3>
            <div className="details-grid">
              <div className="detail-row">
                <span className="detail-label">Valor de Entrada</span>
                <span className="detail-value">
                  R$ {parseFloat(financiamento.valor_entrada).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Valor Financiado</span>
                <span className="detail-value">
                  R$ {parseFloat(financiamento.valor_financiado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Taxa de Juros</span>
                <span className="detail-value">{parseFloat(financiamento.taxa_juros).toFixed(2)}% a.a.</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Data de Início</span>
                <span className="detail-value">
                  {new Date(financiamento.data_inicio).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Parcelas Restantes</span>
                <span className="detail-value">
                  {financiamento.num_parcelas - financiamento.parcelas_pagas}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default FinanciamentoCarro
