import { lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import RequireAuth from './RequireAuth'
import AppLayout from './AppLayout'
import Login from '@/components/Auth/Login'
import SignUp from '@/components/Auth/SignUp'
import ForgotPassword from '@/components/Auth/ForgotPassword'
import ResetPassword from '@/components/Auth/ResetPassword'

const DashboardHome = lazy(() => import('@/components/Dashboard/DashboardHome'))
const ExtratoMensal = lazy(() => import('@/components/Extrato/ExtratoMensal'))
const ContasFixasList = lazy(() => import('@/components/ContasFixas/ContasFixasList'))
const CartoesList = lazy(() => import('@/components/Cartoes/CartoesList'))
const FinanciamentoImovel = lazy(() => import('@/components/Financiamentos/FinanciamentoImovel'))
const FinanciamentoCarro = lazy(() => import('@/components/Financiamentos/FinanciamentoCarro'))
const MetasList = lazy(() => import('@/components/Metas/MetasList'))
const Settings = lazy(() => import('@/components/Settings/Settings'))

export const router = createBrowserRouter([
  { path: '/login', Component: Login },
  { path: '/cadastro', Component: SignUp },
  { path: '/recuperar-senha', Component: ForgotPassword },
  { path: '/reset-password', Component: ResetPassword },
  {
    Component: RequireAuth,
    children: [
      {
        path: '/',
        Component: AppLayout,
        children: [
          { index: true, Component: DashboardHome },
          { path: 'lancamentos', Component: ExtratoMensal },
          { path: 'contas', Component: ContasFixasList },
          { path: 'cartoes', Component: CartoesList },
          { path: 'dividas/imovel', Component: FinanciamentoImovel },
          { path: 'dividas/carro', Component: FinanciamentoCarro },
          { path: 'metas', Component: MetasList },
          { path: 'configuracoes', Component: Settings },
        ],
      },
    ],
  },
])
