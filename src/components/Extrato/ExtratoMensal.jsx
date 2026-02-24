import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus, Edit2, Trash2, Calendar, DollarSign, Filter,
  TrendingUp, TrendingDown, FileText, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  getTransacoesPorMes, 
  addTransacao, 
  updateTransacao, 
  deleteTransacao,
  formatMesReferencia,
  getTotalReceitas,
  getTotalDespesas 
} from '../../services/transacoesService'
import { getCartoes } from '../../services/cartoesService'
import { CATEGORIAS_CONTAS, CATEGORIAS_TRANSACOES } from '../../config/constants'
import { formatCurrency, parseCurrency } from '../../utils/currency'
import './Extrato.css'

const ExtratoMensal = () => {
  const [transacoes, setTransacoes] = useState([])
  const [cartoes, setCartoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTransacao, setEditingTransacao] = useState(null)
  const [mesAtual, setMesAtual] = useState(formatMesReferencia(new Date()))
  const [filtroTipo, setFiltroTipo] = useState('todos') // 'todos', 'receita', 'despesa'
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [resumo, setResumo] = useState({ receitas: 0, despesas: 0, saldo: 0 })

  const [formData, setFormData] = useState({
    tipo: 'despesa',
    categoria: '',
    descricao: '',
    valor: '',
    data_transacao: new Date().toISOString().split('T')[0],
    conta_bancaria: '',
    metodo_pagamento: 'PIX',
    cartao_credito_id: '',
    num_parcelas: 1,
    observacoes: ''
  })

  const [formErrors, setFormErrors] = useState({})

  // Validação inline
  const validateField = (name, value) => {
    let error = ''
    
    switch(name) {
      case 'descricao':
        if (!value.trim()) error = 'Descrição é obrigatória'
        else if (value.trim().length < 3) error = 'Mínimo de 3 caracteres'
        break
      case 'valor':
        const val = parseCurrency(value)
        if (!value || val <= 0) error = 'Valor deve ser maior que zero'
        break
      case 'categoria':
        if (!value) error = 'Categoria é obrigatória'
        break
      case 'data_transacao':
        if (!value) error = 'Data é obrigatória'
        break
      case 'conta_bancaria':
        if (formData.metodo_pagamento !== 'Crédito' && !value.trim()) {
          error = 'Conta bancária é obrigatória'
        }
        break
      default:
        break
    }
    
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }))
    
    return error === ''
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    validateField(name, value)
  }

  const metodosPagamento = ['PIX', 'Dinheiro', 'Débito', 'Crédito', 'Transferência']

  const loadCartoes = useCallback(async () => {
    try {
      const data = await getCartoes()
      setCartoes(data || [])
    } catch (error) {
      console.error('Erro ao carregar cartões:', error)
    }
  }, [])

  const loadTransacoes = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getTransacoesPorMes(mesAtual)
      setTransacoes(data || [])
      
      // Calcular resumo
      const receitas = await getTotalReceitas(mesAtual)
      const despesas = await getTotalDespesas(mesAtual)
      setResumo({
        receitas,
        despesas,
        saldo: receitas - despesas
      })
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
      toast.error('Erro ao carregar extrato')
    } finally {
      setLoading(false)
    }
  }, [mesAtual])

  useEffect(() => {
    loadTransacoes()
    loadCartoes()
  }, [loadTransacoes, loadCartoes])

  const handleOpenModal = (transacao = null) => {
    if (transacao) {
      setEditingTransacao(transacao)
      setFormData({
        tipo: transacao.tipo,
        categoria: transacao.categoria,
        descricao: transacao.descricao,
        valor: transacao.valor_original || transacao.valor,
        data_transacao: transacao.data_transacao,
        conta_bancaria: transacao.conta_bancaria || '',
        metodo_pagamento: transacao.metodo_pagamento || 'PIX',
        cartao_credito_id: transacao.cartao_credito_id || '',
        num_parcelas: transacao.total_parcelas || 1,
        observacoes: transacao.observacoes || ''
      })
    } else {
      setEditingTransacao(null)
      setFormData({
        tipo: 'despesa',
        categoria: '',
        descricao: '',
        valor: '',
        data_transacao: new Date().toISOString().split('T')[0],
        conta_bancaria: '',
        metodo_pagamento: 'PIX',
        cartao_credito_id: '',
        num_parcelas: 1,
        observacoes: ''
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTransacao(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar se selecionou cartão quando método é Crédito
    if (formData.metodo_pagamento === 'Crédito' && !formData.cartao_credito_id) {
      toast.error('Selecione um cartão de crédito!')
      return
    }
    
    try {
      const transacaoData = {
        ...formData,
        valor: parseFloat(formData.valor),
        categoria: formData.categoria || (formData.tipo === 'receita' ? 'Salário' : 'Outros'),
        num_parcelas: formData.metodo_pagamento === 'Crédito' ? parseInt(formData.num_parcelas) : 1
      }

      if (editingTransacao) {
        // Não permite editar transação parcelada (por segurança)
        if (editingTransacao.is_parcelado) {
          toast.error('Não é possível editar transações parceladas. Exclua e crie novamente.')
          return
        }
        await updateTransacao(editingTransacao.id, transacaoData)
        toast.success('Transação atualizada!')
      } else {
        await addTransacao(transacaoData)
        const msg = formData.metodo_pagamento === 'Crédito' && formData.num_parcelas > 1
          ? `Transação parcelada em ${formData.num_parcelas}x adicionada!`
          : 'Transação adicionada!'
        toast.success(msg)
      }

      await loadTransacoes()
      handleCloseModal()
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      toast.error(error.message || 'Erro ao salvar transação')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta transação?')) return
    
    try {
      await deleteTransacao(id)
      await loadTransacoes()
      toast.success('Transação excluída!')
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      toast.error('Erro ao excluir transação')
    }
  }

  const mudarMes = (direcao) => {
    const [ano, mes] = mesAtual.split('-')
    const data = new Date(parseInt(ano), parseInt(mes) - 1, 1)
    
    if (direcao === 'anterior') {
      data.setMonth(data.getMonth() - 1)
    } else {
      data.setMonth(data.getMonth() + 1)
    }
    
    setMesAtual(formatMesReferencia(data))
  }

  const transacoesFiltradas = transacoes.filter(t => {
    if (filtroTipo !== 'todos' && t.tipo !== filtroTipo) return false
    if (filtroCategoria !== 'todas' && t.categoria !== filtroCategoria) return false
    return true
  })

  const categoriasPorTipo = formData.tipo === 'receita' 
    ? ['Salário', 'Freelance', 'Investimentos', 'Outros']
    : [...CATEGORIAS_CONTAS, ...CATEGORIAS_TRANSACOES].filter((v, i, a) => a.indexOf(v) === i)

  if (loading) {
    return (
      <div className="loading-container">
        <img src="/loading-icon.gif" alt="Carregando..." className="loading-icon" />
        <p>Carregando extrato...</p>
      </div>
    )
  }

  return (
    <div className="extrato-container">
      {/* Header com navegação de mês */}
      <div className="extrato-header">
        <div>
          <h2>Extrato Financeiro</h2>
          <div className="mes-navigation">
            <button className="btn-icon" onClick={() => mudarMes('anterior')} aria-label="Mês anterior">
              ←
            </button>
            <span className="mes-atual">
              {new Date(mesAtual + '-01').toLocaleDateString('pt-BR', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
            <button className="btn-icon" onClick={() => mudarMes('proximo')} aria-label="Próximo mês">
              →
            </button>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Nova Transação
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="resumo-cards">
        <div className="resumo-card glass-card receita">
          <div className="resumo-header">
            <TrendingUp size={24} />
            <span>Receitas</span>
          </div>
          <h3>R$ {resumo.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>

        <div className="resumo-card glass-card despesa">
          <div className="resumo-header">
            <TrendingDown size={24} />
            <span>Despesas</span>
          </div>
          <h3>R$ {resumo.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>

        <div className={`resumo-card glass-card saldo ${resumo.saldo >= 0 ? 'positivo' : 'negativo'}`}>
          <div className="resumo-header">
            <DollarSign size={24} />
            <span>Saldo</span>
          </div>
          <h3>R$ {resumo.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-container glass-card">
        <div className="filtro-group">
          <label>
            <Filter size={16} />
            Tipo
          </label>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
          </select>
        </div>

        <div className="filtro-group">
          <label>Categoria</label>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
            <option value="todas">Todas</option>
            {[...new Set(transacoes.map(t => t.categoria))].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="transacoes-list glass-card">
        <h3 className="section-title">
          <FileText size={20} />
          Transações ({transacoesFiltradas.length})
        </h3>

        {transacoesFiltradas.length > 0 ? (
          <div className="transacoes-table">
            {transacoesFiltradas.map(transacao => (
              <div key={transacao.id} className={`transacao-item ${transacao.tipo}`}>
                <div className="transacao-info">
                  <div className="transacao-main">
                    <Calendar size={16} />
                    <span className="data">
                      {new Date(transacao.data_transacao).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={`tipo-badge ${transacao.tipo}`}>
                      {transacao.tipo === 'receita' ? '↑ Receúita' : '↓ Despesa'}
                    </span>
                  </div>
                  <div className="transacao-details">
                    <p className="descricao">{transacao.descricao}</p>
                    <p className="categoria">{transacao.categoria}</p>
                    {transacao.observacoes && (
                      <p className="observacoes" title={transacao.observacoes}>
                        💬 {transacao.observacoes}
                      </p>
                    )}
                    {transacao.metodo_pagamento && (
                      <span className="metodo">{transacao.metodo_pagamento}</span>
                    )}
                    {transacao.is_parcelado && (
                      <span className="parcela-badge">
                        {transacao.parcela_atual}/{transacao.total_parcelas}x
                      </span>
                    )}
                  </div>
                </div>

                <div className="transacao-actions">
                  <span className={`valor ${transacao.tipo}`}>
                    {transacao.tipo === 'receita' ? '+ R$' : '- R$'} {parseFloat(transacao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <div className="actions-buttons">
                    <button 
                      className="btn-icon" 
                      onClick={() => handleOpenModal(transacao)}
                      title="Editar transação"
                      aria-label={`Editar transação ${transacao.descricao}`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn-icon danger" 
                      onClick={() => handleDelete(transacao.id)}
                      title="Excluir transação"
                      aria-label={`Excluir transação ${transacao.descricao}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-message">
            <FileText size={48} />
            <p>Nenhuma transação neste período</p>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              Adicionar Transação
            </button>
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-close">
              <h2>{editingTransacao ? 'Editar Transação' : 'Nova Transação'}</h2>
              <button type="button" className="btn-icon" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value, categoria: '' })}
                    required
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Categoria *</label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    onBlur={handleBlur}
                    className={formErrors.categoria ? 'error' : ''}
                    required
                  >
                    <option value="">Selecione...</option>
                    {categoriasPorTipo.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {formErrors.categoria && <span className="error-message">{formErrors.categoria}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Descrição *</label>
                <input
                  type="text"
                  name="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  onBlur={handleBlur}
                  className={formErrors.descricao ? 'error' : ''}
                  placeholder="Ex: Supermercado, Salário, etc."
                  required
                />
                {formErrors.descricao && <span className="error-message">{formErrors.descricao}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor (R$) *</label>
                  <input
                    type="text"
                    name="valor"
                    value={formData.valor ? formatCurrency(parseFloat(formData.valor) * 100) : ''}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '')
                      const numero = Number(valor) / 100
                      setFormData({ ...formData, valor: numero || '' })
                    }}
                    onBlur={handleBlur}
                    className={formErrors.valor ? 'error' : ''}
                    placeholder="R$ 0,00"
                    required
                  />
                  {formErrors.valor && <span className="error-message">{formErrors.valor}</span>}
                </div>

                <div className="form-group">
                  <label>Data *</label>
                  <input
                    type="date"
                    name="data_transacao"
                    value={formData.data_transacao}
                    onChange={(e) => setFormData({ ...formData, data_transacao: e.target.value })}
                    onBlur={handleBlur}
                    className={formErrors.data_transacao ? 'error' : ''}
                    required
                  />
                  {formErrors.data_transacao && <span className="error-message">{formErrors.data_transacao}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Método de Pagamento</label>
                  <select
                    value={formData.metodo_pagamento}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      metodo_pagamento: e.target.value,
                      cartao_credito_id: e.target.value === 'Crédito' ? formData.cartao_credito_id : '',
                      num_parcelas: e.target.value === 'Crédito' ? formData.num_parcelas : 1
                    })}
                  >
                    {metodosPagamento.map(metodo => (
                      <option key={metodo} value={metodo}>{metodo}</option>
                    ))}
                  </select>
                </div>

                {formData.metodo_pagamento === 'Crédito' && (
                  <>
                    <div className="form-group">
                      <label>Cartão de Crédito *</label>
                      <select
                        value={formData.cartao_credito_id}
                        onChange={(e) => setFormData({ ...formData, cartao_credito_id: e.target.value })}
                        required={formData.metodo_pagamento === 'Crédito'}
                      >
                        <option value="">Selecione um cartão...</option>
                        {cartoes.map(cartao => (
                          <option key={cartao.id} value={cartao.id}>
                            {cartao.nome} - {cartao.bandeira}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Parcelas</label>
                      <select
                        value={formData.num_parcelas}
                        onChange={(e) => setFormData({ ...formData, num_parcelas: parseInt(e.target.value) })}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(num => (
                          <option key={num} value={num}>
                            {num}x {num > 1 && `de R$ ${(parseFloat(formData.valor) / num || 0).toFixed(2)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {formData.metodo_pagamento !== 'Crédito' && formData.metodo_pagamento !== 'Dinheiro' && (
                  <div className="form-group">
                    <label>Conta Bancária</label>
                    <input
                      type="text"
                      value={formData.conta_bancaria}
                      onChange={(e) => setFormData({ ...formData, conta_bancaria: e.target.value })}
                      placeholder="Ex: Nubank, Itaú..."
                    />
                  </div>
                )}
              </div>

              {formData.metodo_pagamento === 'Crédito' && cartoes.length === 0 && (
                <div className="alert-warning">
                  ⚠️ Você não tem cartões cadastrados. 
                  <a href="#" onClick={(e) => { e.preventDefault(); toast('Vá em "Cartões" para cadastrar') }}>
                    Cadastre um cartão primeiro
                  </a>
                </div>
              )}

              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais..."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTransacao ? 'Salvar Alterações' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExtratoMensal
