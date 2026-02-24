import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, CreditCard as CardIcon, FileText, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  getCartoes, 
  addCartao, 
  updateCartao, 
  deleteCartao
} from '../../services/cartoesService'
import { BANDEIRAS_CARTAO } from '../../config/constants'
import { formatCurrency, parseCurrency } from '../../utils/currency'
import { cartaoSchema, validateData, getValidationErrorMessage } from '../../utils/validations'
import { getErrorMessage } from '../../utils/errorHandler'
import FaturaCartao from './FaturaCartao'
import './Cartoes.css'

const CartoesList = () => {
  const [cartoes, setCartoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCartao, setEditingCartao] = useState(null)
  const [cartaoFatura, setCartaoFatura] = useState(null)

  const [formData, setFormData] = useState({
    nome: '',
    bandeira: 'Visa',
    limite_total: '',
    dia_fechamento: '',
    dia_vencimento: ''
  })

  useEffect(() => {
    loadCartoes()
  }, [])

  const loadCartoes = async () => {
    try {
      setLoading(true)
      const data = await getCartoes()
      setCartoes(data || [])
    } catch (error) {
      console.error('Erro ao carregar cartões:', error)
      toast.error('Erro ao carregar cartões')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (cartao = null) => {
    if (cartao) {
      setEditingCartao(cartao)
      setFormData({
        nome: cartao.nome,
        bandeira: cartao.bandeira,
        limite_total: cartao.limite_total,
        dia_fechamento: cartao.dia_fechamento,
        dia_vencimento: cartao.dia_vencimento
      })
    } else {
      setEditingCartao(null)
      setFormData({
        nome: '',
        bandeira: 'Visa',
        limite_total: '',
        dia_fechamento: '',
        dia_vencimento: ''
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCartao(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Preparar e validar dados
      const dataToValidate = {
        nome: formData.nome,
        bandeira: formData.bandeira,
        limite_total: typeof formData.limite_total === 'string' ? parseCurrency(formData.limite_total) : parseFloat(formData.limite_total),
        dia_fechamento: parseInt(formData.dia_fechamento),
        dia_vencimento: parseInt(formData.dia_vencimento)
      }
      
      const validation = validateData(cartaoSchema, dataToValidate)
      if (!validation.success) {
        toast.error(getValidationErrorMessage(validation.errors))
        return
      }

      if (editingCartao) {
        await updateCartao(editingCartao.id, validation.data)
        toast.success('Cartão atualizado!')
      } else {
        await addCartao(validation.data)
        toast.success('Cartão adicionado!')
      }

      await loadCartoes()
      handleCloseModal()
    } catch (error) {
      console.error('Erro ao salvar cartão:', error)
      const errorMsg = getErrorMessage(error)
      toast.error(errorMsg)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este cartão?')) return
    
    try {
      await deleteCartao(id)
      await loadCartoes()
      toast.success('Cartão excluído!')
    } catch (error) {
      console.error('Erro ao excluir cartão:', error)
      toast.error('Erro ao excluir cartão')
    }
  }

  const getPercentualUso = (cartao) => {
    const percentual = (parseFloat(cartao.limite_usado || 0) / parseFloat(cartao.limite_total)) * 100
    return percentual.toFixed(1)
  }

  const getCorBarra = (percentual) => {
    if (percentual < 50) return 'var(--accent-green)'
    if (percentual < 80) return '#f59e0b'
    return 'var(--accent-red)'
  }

  const getLimiteDisponivel = (cartao) => {
    return parseFloat(cartao.limite_total) - parseFloat(cartao.limite_usado || 0)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <img src="/loading-icon.gif" alt="Carregando..." className="loading-icon" />
        <p>Carregando cartões...</p>
      </div>
    )
  }

  return (
    <div className="cartoes-container">
      <div className="cartoes-header">
        <h2>Meus Cartões de Crédito</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Novo Cartão
        </button>
      </div>

      <div className="info-banner">
        <FileText size={20} />
        <p>
          <strong>Dica:</strong> Para adicionar compras no cartão, vá em "Extrato Mensal" e selecione "Crédito" como método de pagamento.
        </p>
      </div>

      {cartoes.length === 0 ? (
        <div className="empty-state glass-card">
          <CardIcon size={64} />
          <h3>Nenhum cartão cadastrado</h3>
          <p>Adicione seus cartões de crédito para começar a controlar seus gastos</p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Adicionar Primeiro Cartão
          </button>
        </div>
      ) : (
        <div className="cartoes-grid">
          {cartoes.map(cartao => {
            const percentual = getPercentualUso(cartao)
            const limiteDisponivel = getLimiteDisponivel(cartao)

            return (
              <div key={cartao.id} className="cartao-card glass-card">
                <div className="cartao-header">
                  <div className="cartao-info">
                    <CardIcon size={28} />
                    <div>
                      <h3>{cartao.nome}</h3>
                      <span className="bandeira-badge">{cartao.bandeira}</span>
                    </div>
                  </div>
                  <div className="cartao-actions">
                    <button 
                      className="btn-icon" 
                      onClick={() => handleOpenModal(cartao)}
                      title="Editar"
                      aria-label="Editar cartão"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn-icon danger" 
                      onClick={() => handleDelete(cartao.id)}
                      aria-label="Excluir cartão"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="cartao-limite">
                  <div className="limite-valores">
                    <div>
                      <span className="label">Limite Disponível</span>
                      <span className={`valor ${limiteDisponivel < 100 ? 'danger' : 'success'}`}>
                        R$ {limiteDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="label">Limite Total</span>
                      <span className="valor-total">
                        R$ {parseFloat(cartao.limite_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${Math.min(percentual, 100)}%`,
                        background: getCorBarra(percentual)
                      }}
                    />
                  </div>
                  <span className="percentual-text">{percentual}% utilizado</span>
                </div>

                <div className="cartao-datas">
                  <div className="data-item">
                    <span className="label">Fechamento</span>
                    <span className="dia">Dia {cartao.dia_fechamento}</span>
                  </div>
                  <div className="data-item">
                    <span className="label">Vencimento</span>
                    <span className="dia">Dia {cartao.dia_vencimento}</span>
                  </div>
                </div>

                <button 
                  className="btn btn-outline btn-ver-fatura"
                  onClick={() => setCartaoFatura(cartao)}
                >
                  <Eye size={18} />
                  Ver Fatura
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-close">
              <h2>{editingCartao ? 'Editar Cartão' : 'Novo Cartão'}</h2>
              <button type="button" className="btn-icon" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome do Cartão *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Nubank, Itaú Mastercard..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Bandeira *</label>
                  <select
                    value={formData.bandeira}
                    onChange={(e) => setFormData({ ...formData, bandeira: e.target.value })}
                    required
                  >
                    {BANDEIRAS_CARTAO.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Limite Total (R$) *</label>
                  <input
                    type="text"
                    value={formData.limite_total ? formatCurrency(parseFloat(formData.limite_total) * 100) : ''}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '')
                      const numero = Number(valor) / 100
                      setFormData({ ...formData, limite_total: numero || '' })
                    }}
                    placeholder="R$ 0,00"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dia de Fechamento *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia_fechamento}
                    onChange={(e) => setFormData({ ...formData, dia_fechamento: e.target.value })}
                    placeholder="Ex: 15"
                    required
                  />
                  <small>Dia em que a fatura fecha</small>
                </div>

                <div className="form-group">
                  <label>Dia de Vencimento *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia_vencimento}
                    onChange={(e) => setFormData({ ...formData, dia_vencimento: e.target.value })}
                    placeholder="Ex: 25"
                    required
                  />
                  <small>Dia em que a fatura vence</small>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCartao ? 'Salvar Alterações' : 'Adicionar Cartão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Fatura */}
      {cartaoFatura && (
        <FaturaCartao 
          cartao={cartaoFatura} 
          onClose={() => {
            setCartaoFatura(null)
            loadCartoes() // Recarregar para atualizar limite após pagamento
          }} 
        />
      )}
    </div>
  )
}

export default CartoesList
