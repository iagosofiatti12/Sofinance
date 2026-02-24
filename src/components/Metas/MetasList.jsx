import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Target, TrendingUp, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMetas, addMeta, updateMeta, deleteMeta } from '../../services/metasService'
import { getUserId } from '../../services/supabaseClient'
import { formatCurrency, parseCurrency } from '../../utils/currency'
import { metaSchema, validateData, getValidationErrorMessage } from '../../utils/validations'
import './Metas.css'

const MetasList = () => {
  const [metas, setMetas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMeta, setEditingMeta] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    valor_meta: '',
    valor_guardado: 0,
    prazo_meses: ''
  })

  useEffect(() => {
    loadMetas()
  }, [])

  const loadMetas = async () => {
    try {
      setLoading(true)
      const data = await getMetas()
      setMetas(data || [])
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (meta = null) => {
    if (meta) {
      setEditingMeta(meta)
      setFormData({
        nome: meta.nome,
        valor_meta: meta.valor_meta,
        valor_guardado: meta.valor_guardado,
        prazo_meses: meta.prazo_meses || ''
      })
    } else {
      setEditingMeta(null)
      setFormData({
        nome: '',
        valor_meta: '',
        valor_guardado: 0,
        prazo_meses: ''
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const userId = await getUserId()
      
      // Preparar e validar dados
      const dataToValidate = {
        nome: formData.nome,
        valor_meta: typeof formData.valor_meta === 'string' ? parseCurrency(formData.valor_meta) : parseFloat(formData.valor_meta),
        valor_guardado: typeof formData.valor_guardado === 'string' ? parseCurrency(formData.valor_guardado) : parseFloat(formData.valor_guardado || 0),
        prazo_meses: formData.prazo_meses ? parseInt(formData.prazo_meses) : null
      }
      
      const validation = validateData(metaSchema, dataToValidate)
      if (!validation.success) {
        toast.error(getValidationErrorMessage(validation.errors))
        return
      }
      
      const metaData = {
        ...validation.data,
        user_id: userId
      }

      if (editingMeta) {
        await updateMeta(editingMeta.id, metaData)
        toast.success('Meta atualizada!')
      } else {
        await addMeta(metaData)
        toast.success('Meta criada!')
      }

      await loadMetas()
      setShowModal(false)
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
      toast.error('Erro ao salvar meta')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir esta meta?')) return
    
    try {
      await deleteMeta(id)
      await loadMetas()
    } catch (error) {
      console.error('Erro ao excluir meta:', error)
      toast.error('Erro ao excluir meta')
    }
  }

  const handleAddValue = async (meta) => {
    const valor = prompt('Quanto você deseja adicionar?')
    if (!valor) return
    
    const valorNumerico = parseFloat(valor)
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error('Valor inválido')
      return
    }

    try {
      await updateMeta(meta.id, {
        ...meta,
        valor_guardado: parseFloat(meta.valor_guardado) + valorNumerico
      })
      await loadMetas()
    } catch (error) {
      console.error('Erro ao adicionar valor:', error)
      toast.error('Erro ao adicionar valor')
    }
  }

  const calcularProgresso = (meta) => {
    return ((meta.valor_guardado / meta.valor_meta) * 100).toFixed(1)
  }

  const calcularFaltante = (meta) => {
    return Math.max(0, meta.valor_meta - meta.valor_guardado)
  }

  const calcularMesesRestantes = (meta) => {
    if (!meta.prazo_meses) return null
    // Simplificado - em produção você calcularia baseado na data de criação
    return meta.prazo_meses
  }

  const calcularPoupancaMensal = (meta) => {
    const faltante = calcularFaltante(meta)
    const meses = calcularMesesRestantes(meta)
    if (!meses || meses <= 0) return null
    return faltante / meses
  }

  const getProgressColor = (progresso) => {
    if (progresso >= 100) return 'var(--accent-green)'
    if (progresso >= 70) return 'var(--accent-blue)'
    if (progresso >= 40) return '#f59e0b'
    return 'var(--accent-red)'
  }

  const totalMetas = metas.reduce((sum, m) => sum + parseFloat(m.valor_meta), 0)
  const totalGuardado = metas.reduce((sum, m) => sum + parseFloat(m.valor_guardado), 0)
  const progressoGeral = totalMetas > 0 ? ((totalGuardado / totalMetas) * 100).toFixed(1) : 0

  if (loading) {
    return (
      <div className="loading-container">
        <img src="/loading-icon.gif" alt="Carregando..." className="loading-icon" />
        <p>Carregando metas...</p>
      </div>
    )
  }

  return (
    <div className="metas-container">
      <div className="metas-header">
        <div>
          <h2>Metas e Desejos</h2>
          <p className="metas-summary">
            <strong>R$ {totalGuardado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            {' '}guardados de{' '}
            <strong>R$ {totalMetas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            {' '}({progressoGeral}%)
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Nova Meta
        </button>
      </div>

      {/* Progresso Geral */}
      {metas.length > 0 && (
        <div className="glass-card">
          <h3 className="section-title">
            <TrendingUp size={20} />
            Progresso Geral
          </h3>
          <div className="progress-bar large">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(progressoGeral, 100)}%` }}
            />
          </div>
          <p className="text-center text-muted mt-2">
            Você está {progressoGeral}% próximo de alcançar todas as suas metas!
          </p>
        </div>
      )}

      {/* Lista de Metas */}
      <div className="metas-grid">
        {metas.length > 0 ? (
          metas.map(meta => {
            const progresso = calcularProgresso(meta)
            const faltante = calcularFaltante(meta)
            const poupancaMensal = calcularPoupancaMensal(meta)
            const atingido = progresso >= 100

            return (
              <div key={meta.id} className={`meta-card glass-card ${atingido ? 'atingida' : ''}`}>
                {atingido && (
                  <div className="meta-badge-atingida">
                    <Target size={16} />
                    Meta Atingida!
                  </div>
                )}

                <div className="meta-header">
                  <div className="meta-icon">
                    <Target size={28} />
                  </div>
                  <div className="meta-actions">
                    <button 
                      className="btn-icon" 
                      onClick={() => handleOpenModal(meta)}
                      title="Editar"
                      aria-label="Editar meta"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn-icon danger" 
                      onClick={() => handleDelete(meta.id)}
                      title="Excluir"
                      aria-label="Excluir meta"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="meta-nome">{meta.nome}</h3>

                <div className="meta-valores">
                  <div className="valor-item">
                    <span className="label">Guardado</span>
                    <span className="valor guardado">
                      R$ {parseFloat(meta.valor_guardado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="valor-item">
                    <span className="label">Meta</span>
                    <span className="valor meta">
                      R$ {parseFloat(meta.valor_meta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="meta-progress">
                  <div className="progress-info">
                    <span className="progress-label">{progresso}%</span>
                    {!atingido && (
                      <span className="faltante">
                        Faltam R$ {faltante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${Math.min(progresso, 100)}%`,
                        background: getProgressColor(progresso)
                      }}
                    />
                  </div>
                </div>

                {poupancaMensal && !atingido && (
                  <div className="meta-sugestao">
                    <DollarSign size={16} />
                    <span>
                      Poupar <strong>R$ {poupancaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</strong>
                      {' '}por {meta.prazo_meses} meses
                    </span>
                  </div>
                )}

                {!atingido && (
                  <button 
                    className="btn btn-success btn-block"
                    onClick={() => handleAddValue(meta)}
                  >
                    <Plus size={16} />
                    Adicionar Valor
                  </button>
                )}

                {atingido && (
                  <div className="meta-atingida-msg">
                    🎉 Parabéns! Você conquistou esta meta!
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="empty-state glass-card">
            <Target size={48} />
            <h3>Nenhuma meta cadastrada</h3>
            <p>Defina suas metas financeiras e acompanhe seu progresso</p>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={18} />
              Criar Primeira Meta
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingMeta ? 'Editar Meta' : 'Nova Meta'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome da Meta *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Viagem para Europa, iPhone novo..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor da Meta (R$) *</label>
                  <input
                    type="text"
                    value={formData.valor_meta ? formatCurrency(parseFloat(formData.valor_meta) * 100) : ''}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '')
                      const numero = Number(valor) / 100
                      setFormData({ ...formData, valor_meta: numero || '' })
                    }}
                    placeholder="R$ 0,00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Já Guardado (R$)</label>
                  <input
                    type="text"
                    value={formData.valor_guardado ? formatCurrency(parseFloat(formData.valor_guardado) * 100) : ''}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '')
                      const numero = Number(valor) / 100
                      setFormData({ ...formData, valor_guardado: numero || '' })
                    }}
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Prazo (meses)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.prazo_meses}
                  onChange={(e) => setFormData({ ...formData, prazo_meses: e.target.value })}
                  placeholder="Opcional"
                />
                <small className="form-hint">
                  Informe em quantos meses você quer atingir esta meta
                </small>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMeta ? 'Salvar' : 'Criar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MetasList
