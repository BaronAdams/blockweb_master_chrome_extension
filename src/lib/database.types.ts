export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// ── Source de vérité unique pour le plan ──────────────────────────────────
// Importez depuis ici dans main.ts, auth.ts, types.ts, etc.
// Ne PAS redéclarer SubscriptionPlan ailleurs.
export type SubscriptionPlan = 'FREE' | 'MONTHLY' | 'YEARLY' | 'LIFETIME'

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id:         string         // uuid — FK auth.users.id
                    username:   string | null
                    created_at: string
                }
                Insert: {
                    id:          string
                    username?:   string | null
                    created_at?: string
                }
                Update: {
                    username?:   string | null
                }
            }
            subscriptions: {
                Row: {
                    id:            string
                    user_id:       string
                    plan:          SubscriptionPlan
                    is_valid:      boolean
                    expires_at:    string | null
                    grace_until:   string | null
                    chariow_email: string | null
                    created_at:    string
                    updated_at:    string
                }
                Insert: {
                    id?:            string
                    user_id:        string
                    plan?:          SubscriptionPlan
                    is_valid?:      boolean
                    expires_at?:    string | null
                    grace_until?:   string | null
                    chariow_email?: string | null
                }
                Update: {
                    plan?:          SubscriptionPlan
                    is_valid?:      boolean
                    expires_at?:    string | null
                    grace_until?:   string | null
                    chariow_email?: string | null
                    updated_at?:    string
                }
            }
        }
        // Supabase v2 — sections vides doivent être Record<string, never>
        // (pas {} : en TypeScript {} accepte n'importe quel objet non-nullish)
        Views:     Record<string, never>
        Functions: Record<string, never>
        Enums:     Record<string, never>
    }
}