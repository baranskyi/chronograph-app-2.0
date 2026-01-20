export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          user_id: string
          room_code: string
          name: string
          created_at: string
          last_used_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          room_code: string
          name?: string
          created_at?: string
          last_used_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          room_code?: string
          name?: string
          created_at?: string
          last_used_at?: string
          is_active?: boolean
        }
      }
      timers: {
        Row: {
          id: string
          room_id: string
          name: string
          duration: number
          position: number
          settings: TimerSettings
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          name: string
          duration?: number
          position?: number
          settings?: TimerSettings
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          name?: string
          duration?: number
          position?: number
          settings?: TimerSettings
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          room_id: string
          started_at: string
          ended_at: string | null
          peak_viewers: number
          total_duration: number
        }
        Insert: {
          id?: string
          room_id: string
          started_at?: string
          ended_at?: string | null
          peak_viewers?: number
          total_duration?: number
        }
        Update: {
          id?: string
          room_id?: string
          started_at?: string
          ended_at?: string | null
          peak_viewers?: number
          total_duration?: number
        }
      }
    }
  }
}

export interface TimerSettings {
  mode: 'countdown' | 'countup' | 'clock'
  soundEnabled: boolean
  flashEnabled: boolean
}
