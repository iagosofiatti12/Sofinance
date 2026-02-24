import React, { useState, useEffect } from 'react'
import { CreditCard, Calendar, TrendingDown, FileText, ChevronRight, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  calcularFaturaCartao, 
  pagarFaturaCartao,
  formatMesReferencia 
} from '../../services/transacoesService'
import { formatCurrency, parseCurrency } from '../../utils/currency'
import './FaturaCartao.css'

const FaturaCartao = ({ cartao, onClose }) => {
  const [mesAtual, setMesAtual] = useState(formatMesReferencia(new Date()))
  const [fatura, setFatura] = useState({ total_fatura: 0, total_transacoes: 0, transacoes: [] })
  const [loading, setLoading] = useState(true)
  const [showPagarModal, setShowPagarModal] = useState(false)
  const [formPagamento, setFormPagamento] = useState({
    valor: '',
    data: new Date().toISOString().split('T')[0],
    conta: ''
  })

  useEffect(() => {
    if (cartao) {
      loadFatura()
    }
  }, [cartao, mesAtual])

  const loadFatura = async () => {
    try {
      setLoading(true)
      const data = await calcularFaturaCartao(cartao.id, mesAtual)
      setFatura(data)
      setFormPagamento({ ...formPagamento, valor: data.total_fatura })
    } catch (error) {
      console.error('Erro ao carregar fatura:', error)
      toast.error('Erro ao carregar fatura')
    } finally {
      setLoading(false)
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

  const handlePagarFatura = async (e) => {
    e.preventDefault()
    
    if (parseFloat(formPagamento.valor) <= 0) {
      toast.error('Valor inválido')
      return
    }

    try {
      await pagarFaturaCartao({
        cartaoId: cartao.id,
        mesReferencia: mesAtual,
        valorPago: parseFloat(formPagamento.valor),
        dataPagamento: formPagamento.data,
        contaBancaria: formPagamento.conta
      })

      toast.success('Fatura paga com sucesso!')
      setShowPagarModal(false)
      onClose()
    } catch (error) {
      console.error('Erro ao pagar fatura:', error)
      toast.error('Erro ao registrar pagamento')
    }
  }

  const mesFormatado = new Date(mesAtual + '-01').toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  })

  const limiteDisponivel = parseFloat(cartao.limite_total) - parseFloat(cartao.limite_usado)
  const percentualUsado = (parseFloat(cartao.limite_usado) / parseFloat(cartao.limite_total)) * 100

  return (
    <div className="modal-overlay">
      <div className="modal-content fatura-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Fatura do Cartão</h2>
            <p className="cartao-info">
              <CreditCard size={18} />
              {cartao.nome} - {cartao.bandeira}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Fechar fatura">
            <X size={24} />
          </button>
        </div>

        {/* Navegação de Mês */}
        <div className="mes-navigation">
          <button className="btn-icon" onClick={() => mudarMes('anterior')} aria-label="Mês anterior">←</button>
          <span className="mes-atual">{mesFormatado}</span>
          <button className="btn-icon" onClick={() => mudarMes('proximo')} aria-label="Próximo mês">→</button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando fatura...</p>
          </div>
        ) : (
          <>
            {/* Resumo da Fatura */}
            <div className="fatura-resumo">
              <div className="resumo-item">
                <span className="label">Valor da Fatura</span>
                <span className="valor-fatura">
                  R$ {parseFloat(fatura.total_fatura).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="resumo-item">
                <span className="label">Transações</span>
                <span>{fatura.total_transacoes} compras</span>
              </div>

              <div className="resumo-item">
                <span className="label">Limite Disponível</span>
                <span className={limiteDisponivel < 100 ? 'text-danger' : 'text-success'}>
                  R$ {limiteDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Barra de Limite */}
            <div className="limite-bar-container">
              <div className="limite-info">
                <span>Limite Usado</span>
                <span>{percentualUsado.toFixed(1)}%</span>
              </div>
              <div className="limite-bar">
                <div 
                  className={`limite-fill ${percentualUsado > 80 ? 'danger' : percentualUsado > 60 ? 'warning' : 'success'}`}
                  style={{ width: `${Math.min(percentualUsado, 100)}%` }}
                />
              </div>
              <div className="limite-values">
                <span>R$ {parseFloat(cartao.limite_usado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <span>R$ {parseFloat(cartao.limite_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Lista de Transações */}
            <div className="transacoes-fatura">
              <h3>
                <FileText size={20} />
                Compras do Mês
              </h3>

              {fatura.transacoes && fatura.transacoes.length > 0 ? (
                <div className="lista-transacoes-fatura">
                  {fatura.transacoes.map((t, index) => (
                    <div key={index} className="transacao-fatura-item">
                      <div>
                        <p className="descricao">{t.descricao}</p>
                        <div className="detalhes">
                          <span className="data">
                            <Calendar size={14} />
                            {new Date(t.data).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="categoria">{t.categoria}</span>
                          {t.parcela && t.parcela !== 'À vista' && (
                            <span className="parcela">{t.parcela}</span>
                          )}
                        </div>
                      </div>
                      <span className="valor">
                        R$ {parseFloat(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-message">
                  <FileText size={48} />
                  <p>Nenhuma compra neste mês</p>
                </div>
              )}
            </div>

            {/* Botão Pagar Fatura */}
            {fatura.total_fatura > 0 && (
              <div className="fatura-actions">
                <button 
                  className="btn btn-primary btn-pagar-fatura"
                  onClick={() => setShowPagarModal(true)}
                >
                  <TrendingDown size={18} />
                  Pagar Fatura
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal de Pagamento */}
        {showPagarModal && (
          <div className="modal-overlay">
            <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-close">
                <h3>Pagar Fatura</h3>
                <button type="button" className="btn-icon" onClick={() => setShowPagarModal(false)} aria-label="Fechar modal">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handlePagarFatura}>
                <div className="form-group">
                  <label>Valor a Pagar (R$)</label>
                  <input
                    type="text"
                    value={formPagamento.valor ? formatCurrency(parseFloat(formPagamento.valor) * 100) : ''}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '')
                      const numero = Number(valor) / 100
                      setFormPagamento({ ...formPagamento, valor: numero || '' })
                    }}
                    placeholder="R$ 0,00"
                    required
                  />
                  <small>Valor total da fatura: R$ {fatura.total_fatura.toFixed(2)}</small>
                </div>

                <div className="form-group">
                  <label>Data do Pagamento</label>
                  <input
                    type="date"
                    value={formPagamento.data}
                    onChange={(e) => setFormPagamento({ ...formPagamento, data: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Conta Bancária (opcional)</label>
                  <input
                    type="text"
                    value={formPagamento.conta}
                    onChange={(e) => setFormPagamento({ ...formPagamento, conta: e.target.value })}
                    placeholder="Ex: Nubank, Itaú..."
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPagarModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Confirmar Pagamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FaturaCartao
