import React, { useState, useEffect } from 'react'
import { CreditCard, Calendar, FileText, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { calcularFaturaCartao, formatMesReferencia } from '../../services/transacoesService'
import { formatarData, formatarMesExtenso, mudarMes as mudarMesRef } from '../../utils/dates'
import './FaturaCartao.css'

const FaturaCartao = ({ cartao, onClose }) => {
  const [mesAtual, setMesAtual] = useState(formatMesReferencia(new Date()))
  const [fatura, setFatura] = useState({ total_fatura: 0, total_transacoes: 0, transacoes: [] })
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error('Erro ao carregar fatura:', error)
      toast.error('Erro ao carregar fatura')
    } finally {
      setLoading(false)
    }
  }

  const mudarMes = direcao => setMesAtual(mudarMesRef(mesAtual, direcao === 'anterior' ? -1 : 1))

  const mesFormatado = formatarMesExtenso(mesAtual)

  const limiteDisponivel = parseFloat(cartao.limite_total) - parseFloat(cartao.limite_usado)
  const percentualUsado = (parseFloat(cartao.limite_usado) / parseFloat(cartao.limite_total)) * 100

  return (
    <div className="modal-overlay">
      <div className="modal-content fatura-modal" onClick={e => e.stopPropagation()}>
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
          <button
            className="btn-icon"
            onClick={() => mudarMes('anterior')}
            aria-label="Mês anterior"
          >
            ←
          </button>
          <span className="mes-atual">{mesFormatado}</span>
          <button className="btn-icon" onClick={() => mudarMes('proximo')} aria-label="Próximo mês">
            →
          </button>
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
                  R${' '}
                  {parseFloat(fatura.total_fatura).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
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

            <p className="text-muted" style={{ fontSize: 13 }}>
              Para registrar o pagamento, lance uma despesa na categoria &quot;Cartão de
              Crédito&quot; no Extrato.
            </p>

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
                <span>
                  R${' '}
                  {parseFloat(cartao.limite_usado).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <span>
                  R${' '}
                  {parseFloat(cartao.limite_total).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
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
                            {formatarData(t.data)}
                          </span>
                          <span className="categoria">{t.categoria}</span>
                          {t.parcela && t.parcela !== 'À vista' && (
                            <span className="parcela">{t.parcela}</span>
                          )}
                        </div>
                      </div>
                      <span className="valor">
                        R${' '}
                        {parseFloat(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
          </>
        )}
      </div>
    </div>
  )
}

export default FaturaCartao
