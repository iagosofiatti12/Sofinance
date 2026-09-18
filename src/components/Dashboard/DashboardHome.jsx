import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  Home as HomeIcon,
  AlertCircle 
} from 'lucide-react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { getContasFixas } from '../../services/contasService'
import { getCartoes } from '../../services/cartoesService'
import { getMetas } from '../../services/metasService'
import { 
  getResumoMensal, 
  getGastosPorCategoria, 
  getEvolucaoMensal,
  formatMesReferencia 
} from '../../services/transacoesService'
import { proximosVencimentos } from '../../utils/vencimentos'
import './DashboardHome.css'

const DashboardHome = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    saldoMes: 0, gastosMes: 0, receitasMes: 0, proximosVencimentos: [],
    contasFixasTotal: 0, limiteDisponivel: 0, metasProgresso: 0, gastosPorCategoria: [], evolucaoMensal: [],
  })

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      const mesAtual = formatMesReferencia(new Date())
      
      // Carregar TODOS os dados em paralelo (3x mais rápido!)
      const [
        resumo,
        gastosCategorias,
        evolucao,
        contas,
        cartoes,
        metas
      ] = await Promise.all([
        getResumoMensal(mesAtual),
        getGastosPorCategoria(mesAtual),
        getEvolucaoMensal(6),
        getContasFixas(),
        getCartoes(),
        getMetas()
      ])
      
      // Calcular totais
      const contasTotal = contas.reduce((sum, conta) => sum + parseFloat(conta.valor), 0)
      const limiteTotal = cartoes.reduce((sum, c) => sum + parseFloat(c.limite_total), 0)
      const limiteUsado = cartoes.reduce((sum, c) => sum + parseFloat(c.limite_usado), 0)
      const metasTotal = metas.reduce((sum, m) => sum + parseFloat(m.valor_meta), 0)
      const metasGuardado = metas.reduce((sum, m) => sum + parseFloat(m.valor_guardado), 0)
      const metasProgresso = metasTotal > 0 ? (metasGuardado / metasTotal) * 100 : 0
      
      // Próximos vencimentos
      const proximosVencimentosLista = proximosVencimentos(contas)

      setStats({
        saldoMes: resumo.saldo,
        gastosMes: resumo.despesas,
        receitasMes: resumo.receitas,
        proximosVencimentos: proximosVencimentosLista,
        contasFixasTotal: contasTotal,
        limiteDisponivel: limiteTotal - limiteUsado,
        metasProgresso,
        gastosPorCategoria: gastosCategorias,
        evolucaoMensal: evolucao
      })
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
      toast.error('Não foi possível carregar o dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Cores para o gráfico de pizza
  const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#ffeb3b']
  
  // Formatar dados dos gráficos
  const gastosPorCategoriaFormatted = useMemo(() => {
    return (stats.gastosPorCategoria || []).map((item, index) => ({
      name: item.categoria,
      value: item.total,
      color: COLORS[index % COLORS.length]
    }))
  }, [stats.gastosPorCategoria])

  const evolucaoMensalFormatted = useMemo(() => {
    return (stats.evolucaoMensal || []).map(item => ({
      mes: item.mes,
      gastos: item.despesas,
      receitas: item.receitas
    }))
  }, [stats.evolucaoMensal])

  if (loading) {
    return (
      <div className="dashboard-loading">
        <img src="/loading-icon.gif" alt="Carregando..." className="loading-icon" />
        <p>Carregando dados...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-home">
      {/* Cards principais */}
      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-header">
            <Wallet size={24} className="stat-icon primary" />
            <span className="stat-label">Saldo do mês</span>
          </div>
          <h2 className="stat-value primary">R$ {(stats.saldoMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          <div className="stat-footer">
            <span>{stats.receitasMes > 0 ? `${((stats.gastosMes / stats.receitasMes) * 100).toFixed(0)}% da receita gasta` : 'Sem receitas neste mês'}</span>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-header">
            <TrendingDown size={24} className="stat-icon danger" />
            <span className="stat-label">Gastos do Mês</span>
          </div>
          <h2 className="stat-value danger">R$ {(stats.gastosMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          <div className="stat-footer">
            {stats.receitasMes > 0 && (
              <span>{((stats.gastosMes / stats.receitasMes) * 100).toFixed(1)}% da receita</span>
            )}
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-header">
            <CreditCard size={24} className="stat-icon success" />
            <span className="stat-label">Limite Disponível</span>
          </div>
          <h2 className="stat-value success">R$ {stats.limiteDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          <div className="stat-footer">
            <span>em cartões de crédito</span>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-header">
            <HomeIcon size={24} className="stat-icon warning" />
            <span className="stat-label">Contas Fixas</span>
          </div>
          <h2 className="stat-value warning">R$ {stats.contasFixasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          <div className="stat-footer">
            <span>mensais</span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        <div className="chart-card glass-card">
          <h3 className="chart-title">Gastos por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gastosPorCategoriaFormatted}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {gastosPorCategoriaFormatted.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card glass-card">
          <h3 className="chart-title">Evolução Mensal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucaoMensalFormatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
              <XAxis dataKey="mes" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--card-bg)', 
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="receitas" 
                stroke="var(--accent-green)" 
                strokeWidth={2}
                name="Receitas"
              />
              <Line 
                type="monotone" 
                dataKey="gastos" 
                stroke="var(--accent-red)" 
                strokeWidth={2}
                name="Gastos"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Próximos Vencimentos e Metas */}
      <div className="bottom-grid">
        <div className="glass-card">
          <h3 className="section-title">
            <AlertCircle size={20} />
            Próximos Vencimentos
          </h3>
          <div className="vencimentos-list">
            {stats.proximosVencimentos.length > 0 ? (
              stats.proximosVencimentos.map(conta => (
                <div key={conta.id} className="vencimento-item">
                  <div>
                    <p className="vencimento-nome">{conta.nome}</p>
                    <p className="vencimento-dia">{conta.diasRestantes === 0 ? 'Vence hoje' : `Dia ${conta.dia_vencimento} · em ${conta.diasRestantes} dias`}</p>
                  </div>
                  <span className="vencimento-valor">
                    R$ {parseFloat(conta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            ) : (
              <p className="empty-message">Nenhum vencimento próximo</p>
            )}
          </div>
        </div>

        <div className="glass-card">
          <h3 className="section-title">
            <TrendingUp size={20} />
            Progresso de Metas
          </h3>
          <div className="metas-progress">
            <div className="progress-info">
              <span>Meta de Economia</span>
              <span>{stats.metasProgresso.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(stats.metasProgresso, 100)}%` }}
              />
            </div>
            <p className="progress-text">
              {stats.metasProgresso >= 100
                ? 'Todas as metas atingidas!'
                : stats.metasProgresso > 0
                  ? 'Continue guardando.'
                  : 'Crie uma meta para acompanhar aqui.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome
