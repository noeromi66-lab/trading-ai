export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          subscription_tier: 'free' | 'student' | 'trader'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          subscription_tier?: 'free' | 'student' | 'trader'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          subscription_tier?: 'free' | 'student' | 'trader'
          updated_at?: string
        }
      }
      trading_pairs: {
        Row: {
          id: string
          symbol: string
          display_name: string
          is_active: boolean
          pip_value: number
          created_at: string
        }
        Insert: {
          id?: string
          symbol: string
          display_name: string
          is_active?: boolean
          pip_value?: number
          created_at?: string
        }
        Update: {
          id?: string
          symbol?: string
          display_name?: string
          is_active?: boolean
          pip_value?: number
        }
      }
      signals: {
        Row: {
          id: string
          pair_id: string
          signal_type: 'BUY' | 'SELL' | 'HOLD'
          strategy: string
          entry_price: number | null
          stop_loss: number | null
          take_profit_1: number | null
          take_profit_2: number | null
          confidence_score: number
          risk_reward_ratio: number | null
          timeframe: string
          explanation: string | null
          detected_patterns: Json
          is_killzone: boolean
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          pair_id: string
          signal_type: 'BUY' | 'SELL' | 'HOLD'
          strategy: string
          entry_price?: number | null
          stop_loss?: number | null
          take_profit_1?: number | null
          take_profit_2?: number | null
          confidence_score?: number
          risk_reward_ratio?: number | null
          timeframe?: string
          explanation?: string | null
          detected_patterns?: Json
          is_killzone?: boolean
          created_at?: string
          expires_at?: string
        }
        Update: {
          pair_id?: string
          signal_type?: 'BUY' | 'SELL' | 'HOLD'
          strategy?: string
          entry_price?: number | null
          stop_loss?: number | null
          take_profit_1?: number | null
          take_profit_2?: number | null
          confidence_score?: number
          risk_reward_ratio?: number | null
          timeframe?: string
          explanation?: string | null
          detected_patterns?: Json
          is_killzone?: boolean
          expires_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_pairs: Json
          notification_email: boolean
          notification_sms: boolean
          notification_whatsapp: boolean
          min_confidence_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferred_pairs?: Json
          notification_email?: boolean
          notification_sms?: boolean
          notification_whatsapp?: boolean
          min_confidence_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          preferred_pairs?: Json
          notification_email?: boolean
          notification_sms?: boolean
          notification_whatsapp?: boolean
          min_confidence_score?: number
          updated_at?: string
        }
      }
      signal_notifications: {
        Row: {
          id: string
          user_id: string
          signal_id: string
          notification_type: string
          sent_at: string
          status: 'pending' | 'sent' | 'failed'
        }
      }
      user_signal_history: {
        Row: {
          id: string
          user_id: string
          signal_id: string
          action_taken: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          signal_id: string
          action_taken?: string
          created_at?: string
        }
      }
    }
  }
}
