export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cartoes_credito: {
        Row: {
          bandeira: string
          created_at: string
          dia_fechamento: number
          dia_vencimento: number
          id: string
          limite_total: number
          limite_usado: number | null
          nome_cartao: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bandeira: string
          created_at?: string
          dia_fechamento: number
          dia_vencimento: number
          id?: string
          limite_total: number
          limite_usado?: number | null
          nome_cartao: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bandeira?: string
          created_at?: string
          dia_fechamento?: number
          dia_vencimento?: number
          id?: string
          limite_total?: number
          limite_usado?: number | null
          nome_cartao?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contas_bancarias: {
        Row: {
          ativa: boolean | null
          cor: string | null
          created_at: string
          id: string
          nome: string
          saldo_atual: number | null
          tipo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativa?: boolean | null
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          saldo_atual?: number | null
          tipo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativa?: boolean | null
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          saldo_atual?: number | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contas_fixas: {
        Row: {
          ativa: boolean | null
          categoria: string
          created_at: string
          dia_vencimento: number
          id: string
          nome: string
          user_id: string
          valor: number
        }
        Insert: {
          ativa?: boolean | null
          categoria: string
          created_at?: string
          dia_vencimento: number
          id?: string
          nome: string
          user_id: string
          valor: number
        }
        Update: {
          ativa?: boolean | null
          categoria?: string
          created_at?: string
          dia_vencimento?: number
          id?: string
          nome?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      financiamento_carro: {
        Row: {
          created_at: string
          data_inicio: string
          id: string
          modelo_carro: string
          num_parcelas: number
          parcela_valor: number
          parcelas_pagas: number | null
          taxa_juros: number
          user_id: string
          valor_entrada: number
          valor_financiado: number
          valor_total: number
        }
        Insert: {
          created_at?: string
          data_inicio: string
          id?: string
          modelo_carro: string
          num_parcelas: number
          parcela_valor: number
          parcelas_pagas?: number | null
          taxa_juros: number
          user_id: string
          valor_entrada: number
          valor_financiado: number
          valor_total: number
        }
        Update: {
          created_at?: string
          data_inicio?: string
          id?: string
          modelo_carro?: string
          num_parcelas?: number
          parcela_valor?: number
          parcelas_pagas?: number | null
          taxa_juros?: number
          user_id?: string
          valor_entrada?: number
          valor_financiado?: number
          valor_total?: number
        }
        Relationships: []
      }
      financiamento_imovel: {
        Row: {
          created_at: string
          data_inicio: string
          id: string
          num_parcelas: number
          parcela_valor: number
          parcelas_pagas: number | null
          taxa_juros: number
          taxa_obra: number | null
          user_id: string
          valor_financiado: number
          valor_total: number
        }
        Insert: {
          created_at?: string
          data_inicio: string
          id?: string
          num_parcelas: number
          parcela_valor: number
          parcelas_pagas?: number | null
          taxa_juros: number
          taxa_obra?: number | null
          user_id: string
          valor_financiado: number
          valor_total: number
        }
        Update: {
          created_at?: string
          data_inicio?: string
          id?: string
          num_parcelas?: number
          parcela_valor?: number
          parcelas_pagas?: number | null
          taxa_juros?: number
          taxa_obra?: number | null
          user_id?: string
          valor_financiado?: number
          valor_total?: number
        }
        Relationships: []
      }
      metas_desejos: {
        Row: {
          created_at: string
          id: string
          nome: string
          prazo_meses: number | null
          user_id: string
          valor_guardado: number | null
          valor_meta: number
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          prazo_meses?: number | null
          user_id: string
          valor_guardado?: number | null
          valor_meta: number
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          prazo_meses?: number | null
          user_id?: string
          valor_guardado?: number | null
          valor_meta?: number
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          categoria: string
          created_at: string
          id: string
          mes_referencia: string
          tipo: string
          updated_at: string | null
          user_id: string
          valor_planejado: number
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          mes_referencia: string
          tipo: string
          updated_at?: string | null
          user_id: string
          valor_planejado: number
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          mes_referencia?: string
          tipo?: string
          updated_at?: string | null
          user_id?: string
          valor_planejado?: number
        }
        Relationships: []
      }
      perfis: {
        Row: {
          avatar_url: string | null
          created_at: string
          data_nascimento: string | null
          id: string
          nome_completo: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          data_nascimento?: string | null
          id: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          data_nascimento?: string | null
          id?: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transacoes: {
        Row: {
          anexo_url: string | null
          cartao_credito_id: string | null
          categoria: string
          conta_bancaria: string | null
          created_at: string
          data_transacao: string
          descricao: string
          id: string
          is_parcelado: boolean
          mes_referencia: string
          metodo_pagamento: string | null
          observacoes: string | null
          origem: string | null
          origem_id: string | null
          parcela_atual: number | null
          recorrente: boolean | null
          tipo: string
          total_parcelas: number | null
          transacao_pai_id: string | null
          updated_at: string | null
          user_id: string
          valor: number
          valor_original: number | null
        }
        Insert: {
          anexo_url?: string | null
          cartao_credito_id?: string | null
          categoria: string
          conta_bancaria?: string | null
          created_at?: string
          data_transacao?: string
          descricao: string
          id?: string
          is_parcelado?: boolean
          mes_referencia: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          origem?: string | null
          origem_id?: string | null
          parcela_atual?: number | null
          recorrente?: boolean | null
          tipo: string
          total_parcelas?: number | null
          transacao_pai_id?: string | null
          updated_at?: string | null
          user_id: string
          valor: number
          valor_original?: number | null
        }
        Update: {
          anexo_url?: string | null
          cartao_credito_id?: string | null
          categoria?: string
          conta_bancaria?: string | null
          created_at?: string
          data_transacao?: string
          descricao?: string
          id?: string
          is_parcelado?: boolean
          mes_referencia?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          origem?: string | null
          origem_id?: string | null
          parcela_atual?: number | null
          recorrente?: boolean | null
          tipo?: string
          total_parcelas?: number | null
          transacao_pai_id?: string | null
          updated_at?: string | null
          user_id?: string
          valor?: number
          valor_original?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_cartao_credito_id_fkey"
            columns: ["cartao_credito_id"]
            isOneToOne: false
            referencedRelation: "cartoes_credito"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_transacao_pai_id_fkey"
            columns: ["transacao_pai_id"]
            isOneToOne: false
            referencedRelation: "transacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes_cartao: {
        Row: {
          cartao_id: string
          categoria: string
          created_at: string
          data_compra: string
          descricao: string
          id: string
          num_parcelas: number | null
          parcelado: boolean | null
          valor: number
        }
        Insert: {
          cartao_id: string
          categoria: string
          created_at?: string
          data_compra: string
          descricao: string
          id?: string
          num_parcelas?: number | null
          parcelado?: boolean | null
          valor: number
        }
        Update: {
          cartao_id?: string
          categoria?: string
          created_at?: string
          data_compra?: string
          descricao?: string
          id?: string
          num_parcelas?: number | null
          parcelado?: boolean | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_cartao_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "cartoes_credito"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          senha_hash: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          senha_hash: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          senha_hash?: string
        }
        Relationships: []
      }
    }
    Views: {
      gastos_por_categoria: {
        Row: {
          categoria: string | null
          mes_referencia: string | null
          quantidade: number | null
          total: number | null
          user_id: string | null
        }
        Relationships: []
      }
      resumo_mensal: {
        Row: {
          mes_referencia: string | null
          saldo: number | null
          total_despesas: number | null
          total_receitas: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      obter_despesas_mes: {
        Args: { mes: string; usuario_id: string }
        Returns: number
      }
      obter_receitas_mes: {
        Args: { mes: string; usuario_id: string }
        Returns: number
      }
      obter_saldo_total: { Args: { usuario_id: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
