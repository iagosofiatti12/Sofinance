---
name: sofinance-domain
description: Regras de negócio financeiras do Sofinance (fatura de cartão, parcelas, saldo, recorrências, dívidas SAC e Price, orçamento, LGPD e formatação brasileira). Use sempre que a tarefa tocar dinheiro, fatura, parcela, saldo, vencimento, dívida ou dado pessoal.
---

# Regras de negócio do Sofinance

## Contas e saldo

Saldo de conta = saldo inicial + entradas pagas − saídas pagas ± transferências. Lançamento pendente entra só no saldo projetado. Transferência tem origem e destino diferentes e não conta como receita nem como despesa nos relatórios.

## Cartão de crédito (modelo "fatura como conta a pagar")

Criar um cartão exige apenas um nome. Cor, dia de vencimento, dia de fechamento e conta pagadora são opcionais. Não existe limite de crédito no modelo.

Todo mês o sistema cria uma fatura por cartão como conta a pagar. O usuário informa o valor total quando a fatura chega; pagar gera uma despesa na categoria "Cartão de Crédito" debitada da conta escolhida.

Detalhar a fatura é opcional. Relatórios por categoria usam os itens quando existem e o total informado quando não existem. Nunca somar os dois.

Com dia de fechamento informado: item com data entre o fechamento anterior (exclusivo) e o fechamento atual (inclusivo) cai na fatura que vence no dia de vencimento seguinte. Se o vencimento for menor que o fechamento, a fatura vence no mês seguinte ao fechamento. Sem fechamento informado, o item cai na fatura do mês da data.

Parcelamento em N vezes cria N itens em faturas consecutivas, com arredondamento em centavos e a última parcela absorvendo a diferença.

Exemplo canônico: cartão fecha dia 15 e vence dia 25. Compra em 16/03 entra na fatura que vence em 25/04.

## Recorrências

Geram lançamentos pendentes por materialização diária, nunca calculados na hora da renderização. Pagar é marcar como pago. Frequências: mensal, semanal, anual. Dia 29, 30 ou 31 em mês curto cai no último dia do mês.

## Dívidas

Tipos: imóvel, veículo, empréstimo, consórcio, outro. Sistemas: Price (parcela fixa), SAC (amortização fixa) e fixo (parcela informada). Imóvel no Brasil costuma ser SAC com TR; veículo costuma ser Price. Taxa informada ao ano converte para mês por `(1 + i)^(1/12) − 1`. Saldo devedor nunca é parcelas restantes vezes valor da parcela em SAC ou Price.

## Orçamento e metas

Orçamento por categoria compara gasto pago mais pendente do mês contra o limite, com alerta em 80% e 100%. Meta tem histórico de aportes; progresso é a soma dos aportes dividida pelo valor alvo.

## Formatação

`R$ 1.234,56`; datas `dd/MM/yyyy`; mês de referência `YYYY-MM`; `Intl.NumberFormat('pt-BR')`. Fuso `America/Sao_Paulo`.

## LGPD

Consentimento explícito no cadastro, exportação dos dados e exclusão completa (dados, storage e `auth.users`) por Edge Function com service role. Nunca expor a chave `service_role` no cliente.
