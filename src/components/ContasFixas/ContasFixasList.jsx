import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Check, X, Calendar, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSkeleton from '../LoadingSkeleton'
import EmptyState from '../EmptyState'
import { 
  getContasFixas, 
  addContaFixa, 
  updateContaFixa, 
  deleteContaFixa 
} from '../../services/contasService'
import { getUserId } from '../../services/supabaseClient'
import { CATEGORIAS_CONTAS } from '../../config/constants'
import { formatCurrency, parseCurrency } from '../../utils/currency'
import { contaFixaSchema, validateData, getValidationErrorMessage } from '../../utils/validations'
import './ContasFixas.css'

const ContasFixasList = () => {
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingConta, setEditingConta] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    dia_vencimento: '',
    categoria: 'Moradia',
    ativa: true
  })

  // Categorias agora vêm de constants.js

  useEffect(() => {
    loadContas()
  }, [])

  const loadContas = async () => {
    try {
      setLoading(true)
      const data = await getContasFixas()
      setContas(data || [])
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
      // Toast notification apenas se não for erro de dados vazios
      if (error.message && !error.message.includes('No rows')) {
        toast.error('Erro ao conectar com o banco de dados')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (conta = null) => {
    if (conta) {
      setEditingConta(conta)
      setFormData({
        nome: conta.nome,
        valor: conta.valor,
        dia_vencimento: conta.dia_vencimento,
        categoria: conta.categoria,
        ativa: conta.ativa
      })
    } else {
      setEditingConta(null)
      setFormData({
        nome: '',
        valor: '',
        dia_vencimento: '',
        categoria: 'Moradia',
        ativa: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingConta(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const userId = await getUserId()
      
      // Preparar dados
      const dataToValidate = {
        nome: formData.nome,
        valor: typeof formData.valor === 'string' ? parseCurrency(formData.valor) : parseFloat(formData.valor),
        dia_vencimento: parseInt(formData.dia_vencimento),
        categoria: formData.categoria,
        ativa: formData.ativa !== false
      }
      
      // Validar com Zod
      const validation = validateData(contaFixaSchema, dataToValidate)
      if (!validation.success) {
        toast.error(getValidationErrorMessage(validation.errors))
        return
      }
      
      const contaData = {
        ...validation.data,
        user_id: userId
      }

      if (editingConta) {
        await updateContaFixa(editingConta.id, contaData)
        toast.success('Conta atualizada com sucesso!')
      } else {
        await addContaFixa(contaData)
        toast.success('Conta adicionada com sucesso!')
      }

      await loadContas()
      handleCloseModal()
    } catch (error) {
      console.error('Erro ao salvar conta:', error)
      toast.error('Erro ao salvar conta fixa')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta conta?')) return
    
    try {
      await deleteContaFixa(id)
      await loadContas()
      toast.success('Conta excluída com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir conta:', error)
      toast.error('Erro ao excluir conta fixa')
    }
  }

  const handleToggleAtiva = async (conta) => {
    try {
      await updateContaFixa(conta.id, { ...conta, ativa: !conta.ativa })
      await loadContas()
      toast.success(`Conta ${!conta.ativa ? 'ativada' : 'desativada'} com sucesso!`)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status da conta')
    }
  }

  const getDiasRestantes = (diaVencimento) => {
    const hoje = new Date().getDate()
    const dias = diaVencimento - hoje
    return dias >= 0 ? dias : 30 + dias
  }

  const getStatusBadge = (diasRestantes) => {
    if (diasRestantes <= 3) return 'badge-danger'
    if (diasRestantes <= 7) return 'badge-warning'
    return 'badge-success'
  }

  const totalContas = contas
    .filter(c => c.ativa)
    .reduce((sum, c) => sum + parseFloat(c.valor), 0)

  if (loading) {
    return (
      <div className="contas-fixas-container">
        <div className="contas-header">
          <div>
            <h2>Contas Fixas</h2>
          </div>
        </div>
        <LoadingSkeleton type="card" count={3} />
      </div>
    )
  }

  return (
    <div className="contas-fixas-container">
      <div className="contas-header">
        <div>
          <h2>Contas Fixas</h2>
          <p className="total-contas">
            Total mensal: <strong>R$ {totalContas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} />
          Nova Conta
        </button>
      </div>

      <div className="contas-grid">
        {contas.length > 0 ? (
          contas.map(conta => {
            const diasRestantes = getDiasRestantes(conta.dia_vencimento)
            return (
              <div key={conta.id} className={`conta-card glass-card ${!conta.ativa ? 'inativa' : ''}`}>
                <div className="conta-card-header">
                  <div className="conta-info">
                    <h3>{conta.nome}</h3>
                    <span className={`badge ${conta.ativa ? 'badge-success' : 'badge-danger'}`}>
                      {conta.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <div className="conta-actions">
                    <button 
                      className="btn-icon" 
                      onClick={() => handleOpenModal(conta)}
                      title="Editar"
                      aria-label="Editar conta fixa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn-icon danger" 
                      onClick={() => handleDelete(conta.id)}
                      aria-label="Excluir conta fixa"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="conta-details">
                  <div className="detail-item">
                    <DollarSign size={18} />
                    <span className="valor">R$ {parseFloat(conta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  
                  <div className="detail-item">
                    <Calendar size={18} />
                    <span>Vencimento: dia {conta.dia_vencimento}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="categoria-badge">{conta.categoria}</span>
                  </div>

                  {conta.ativa && (
                    <div className="detail-item">
                      <span className={`badge ${getStatusBadge(diasRestantes)}`}>
                        {diasRestantes === 0 ? 'Vence hoje' : `${diasRestantes} dias restantes`}
                      </span>
                    </div>
                  )}
                </div>

                <button 
                  className={`btn btn-sm ${conta.ativa ? 'btn-secondary' : 'btn-success'}`}
                  onClick={() => handleToggleAtiva(conta)}
                >
                  {conta.ativa ? <X size={16} /> : <Check size={16} />}
                  {conta.ativa ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            )
          })
        ) : (
          <EmptyState
            icon={Calendar}
            title="Nenhuma Conta Cadastrada"
            message="Adicione suas contas fixas mensais para melhor controle financeiro"
            actionLabel="Adicionar Primeira Conta"
            onAction={() => handleOpenModal()}
          />
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingConta ? 'Editar Conta' : 'Nova Conta Fixa'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome da Conta *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Aluguel, Luz, Internet..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Valor (R$) *</label>
                <input
                  type="text"
                  value={formData.valor ? formatCurrency(parseFloat(formData.valor) * 100) : ''}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, '')
                    const numero = Number(valor) / 100
                    setFormData({ ...formData, valor: numero || '' })
                  }}
                  placeholder="R$ 0,00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Dia do Vencimento *</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dia_vencimento}
                  onChange={(e) => setFormData({ ...formData, dia_vencimento: e.target.value })}
                  placeholder="1-31"
                  required
                />
              </div>

              <div className="form-group">
                <label>Categoria *</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  required
                >
                  {CATEGORIAS_CONTAS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.ativa}
                    onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                  />
                  Conta ativa
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingConta ? 'Salvar Alterações' : 'Adicionar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContasFixasList
