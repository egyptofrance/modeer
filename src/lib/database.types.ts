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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_delete_tokens: {
        Row: {
          token: string
          user_id: string
        }
        Insert: {
          token?: string
          user_id: string
        }
        Update: {
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_delete_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          id: boolean
          settings: Json
          updated_at: string
        }
        Insert: {
          id?: boolean
          settings?: Json
          updated_at?: string
        }
        Update: {
          id?: boolean
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in: string
          check_out: string | null
          created_at: string | null
          employee_id: string
          id: string
          is_holiday: boolean | null
          is_on_time: boolean | null
          notes: string | null
          overtime_hours: number | null
          work_date: string
        }
        Insert: {
          check_in?: string
          check_out?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          is_holiday?: boolean | null
          is_on_time?: boolean | null
          notes?: string | null
          overtime_hours?: number | null
          work_date?: string
        }
        Update: {
          check_in?: string
          check_out?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          is_holiday?: boolean | null
          is_on_time?: boolean | null
          notes?: string | null
          overtime_hours?: number | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_customers: {
        Row: {
          billing_email: string
          default_currency: string | null
          gateway_customer_id: string
          gateway_name: string
          metadata: Json | null
          workspace_id: string
        }
        Insert: {
          billing_email: string
          default_currency?: string | null
          gateway_customer_id: string
          gateway_name: string
          metadata?: Json | null
          workspace_id: string
        }
        Update: {
          billing_email?: string
          default_currency?: string | null
          gateway_customer_id?: string
          gateway_name?: string
          metadata?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          amount: number
          currency: string
          due_date: string | null
          gateway_customer_id: string
          gateway_invoice_id: string
          gateway_name: string
          gateway_price_id: string | null
          gateway_product_id: string | null
          hosted_invoice_url: string | null
          paid_date: string | null
          status: string
        }
        Insert: {
          amount: number
          currency: string
          due_date?: string | null
          gateway_customer_id: string
          gateway_invoice_id: string
          gateway_name: string
          gateway_price_id?: string | null
          gateway_product_id?: string | null
          hosted_invoice_url?: string | null
          paid_date?: string | null
          status: string
        }
        Update: {
          amount?: number
          currency?: string
          due_date?: string | null
          gateway_customer_id?: string
          gateway_invoice_id?: string
          gateway_name?: string
          gateway_price_id?: string | null
          gateway_product_id?: string | null
          hosted_invoice_url?: string | null
          paid_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_gateway_customer_id_fkey"
            columns: ["gateway_customer_id"]
            isOneToOne: false
            referencedRelation: "billing_customers"
            referencedColumns: ["gateway_customer_id"]
          },
          {
            foreignKeyName: "billing_invoices_gateway_price_id_fkey"
            columns: ["gateway_price_id"]
            isOneToOne: false
            referencedRelation: "billing_prices"
            referencedColumns: ["gateway_price_id"]
          },
          {
            foreignKeyName: "billing_invoices_gateway_product_id_fkey"
            columns: ["gateway_product_id"]
            isOneToOne: false
            referencedRelation: "billing_products"
            referencedColumns: ["gateway_product_id"]
          },
        ]
      }
      billing_one_time_payments: {
        Row: {
          amount: number
          charge_date: string
          currency: string
          gateway_charge_id: string
          gateway_customer_id: string
          gateway_invoice_id: string
          gateway_name: string
          gateway_price_id: string
          gateway_product_id: string
          status: string
        }
        Insert: {
          amount: number
          charge_date: string
          currency: string
          gateway_charge_id: string
          gateway_customer_id: string
          gateway_invoice_id: string
          gateway_name: string
          gateway_price_id: string
          gateway_product_id: string
          status: string
        }
        Update: {
          amount?: number
          charge_date?: string
          currency?: string
          gateway_charge_id?: string
          gateway_customer_id?: string
          gateway_invoice_id?: string
          gateway_name?: string
          gateway_price_id?: string
          gateway_product_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_one_time_payments_gateway_customer_id_fkey"
            columns: ["gateway_customer_id"]
            isOneToOne: false
            referencedRelation: "billing_customers"
            referencedColumns: ["gateway_customer_id"]
          },
          {
            foreignKeyName: "billing_one_time_payments_gateway_invoice_id_fkey"
            columns: ["gateway_invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["gateway_invoice_id"]
          },
          {
            foreignKeyName: "billing_one_time_payments_gateway_price_id_fkey"
            columns: ["gateway_price_id"]
            isOneToOne: false
            referencedRelation: "billing_prices"
            referencedColumns: ["gateway_price_id"]
          },
          {
            foreignKeyName: "billing_one_time_payments_gateway_product_id_fkey"
            columns: ["gateway_product_id"]
            isOneToOne: false
            referencedRelation: "billing_products"
            referencedColumns: ["gateway_product_id"]
          },
        ]
      }
      billing_payment_methods: {
        Row: {
          gateway_customer_id: string
          id: string
          is_default: boolean
          payment_method_details: Json
          payment_method_id: string
          payment_method_type: string
        }
        Insert: {
          gateway_customer_id: string
          id?: string
          is_default?: boolean
          payment_method_details: Json
          payment_method_id: string
          payment_method_type: string
        }
        Update: {
          gateway_customer_id?: string
          id?: string
          is_default?: boolean
          payment_method_details?: Json
          payment_method_id?: string
          payment_method_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_payment_methods_gateway_customer_id_fkey"
            columns: ["gateway_customer_id"]
            isOneToOne: false
            referencedRelation: "billing_customers"
            referencedColumns: ["gateway_customer_id"]
          },
        ]
      }
      billing_prices: {
        Row: {
          active: boolean
          amount: number
          currency: string
          free_trial_days: number | null
          gateway_name: string
          gateway_price_id: string
          gateway_product_id: string
          recurring_interval: string
          recurring_interval_count: number
          tier: string | null
        }
        Insert: {
          active?: boolean
          amount: number
          currency: string
          free_trial_days?: number | null
          gateway_name: string
          gateway_price_id?: string
          gateway_product_id: string
          recurring_interval: string
          recurring_interval_count?: number
          tier?: string | null
        }
        Update: {
          active?: boolean
          amount?: number
          currency?: string
          free_trial_days?: number | null
          gateway_name?: string
          gateway_price_id?: string
          gateway_product_id?: string
          recurring_interval?: string
          recurring_interval_count?: number
          tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_prices_gateway_product_id_fkey"
            columns: ["gateway_product_id"]
            isOneToOne: false
            referencedRelation: "billing_products"
            referencedColumns: ["gateway_product_id"]
          },
        ]
      }
      billing_products: {
        Row: {
          active: boolean
          description: string | null
          features: Json | null
          gateway_name: string
          gateway_product_id: string
          is_visible_in_ui: boolean
          name: string
        }
        Insert: {
          active?: boolean
          description?: string | null
          features?: Json | null
          gateway_name: string
          gateway_product_id: string
          is_visible_in_ui?: boolean
          name: string
        }
        Update: {
          active?: boolean
          description?: string | null
          features?: Json | null
          gateway_name?: string
          gateway_product_id?: string
          is_visible_in_ui?: boolean
          name?: string
        }
        Relationships: []
      }
      billing_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          currency: string
          current_period_end: string
          current_period_start: string
          gateway_customer_id: string
          gateway_name: string
          gateway_price_id: string
          gateway_product_id: string
          gateway_subscription_id: string
          id: string
          is_trial: boolean
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
        }
        Insert: {
          cancel_at_period_end: boolean
          currency: string
          current_period_end: string
          current_period_start: string
          gateway_customer_id: string
          gateway_name: string
          gateway_price_id: string
          gateway_product_id: string
          gateway_subscription_id: string
          id?: string
          is_trial: boolean
          quantity?: number | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean
          currency?: string
          current_period_end?: string
          current_period_start?: string
          gateway_customer_id?: string
          gateway_name?: string
          gateway_price_id?: string
          gateway_product_id?: string
          gateway_subscription_id?: string
          id?: string
          is_trial?: boolean
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_gateway_customer_id_fkey"
            columns: ["gateway_customer_id"]
            isOneToOne: false
            referencedRelation: "billing_customers"
            referencedColumns: ["gateway_customer_id"]
          },
          {
            foreignKeyName: "billing_subscriptions_gateway_price_id_fkey"
            columns: ["gateway_price_id"]
            isOneToOne: false
            referencedRelation: "billing_prices"
            referencedColumns: ["gateway_price_id"]
          },
          {
            foreignKeyName: "billing_subscriptions_gateway_product_id_fkey"
            columns: ["gateway_product_id"]
            isOneToOne: false
            referencedRelation: "billing_products"
            referencedColumns: ["gateway_product_id"]
          },
        ]
      }
      billing_usage_logs: {
        Row: {
          feature: string
          gateway_customer_id: string
          id: string
          timestamp: string
          usage_amount: number
        }
        Insert: {
          feature: string
          gateway_customer_id: string
          id?: string
          timestamp?: string
          usage_amount: number
        }
        Update: {
          feature?: string
          gateway_customer_id?: string
          id?: string
          timestamp?: string
          usage_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_usage_logs_gateway_customer_id_fkey"
            columns: ["gateway_customer_id"]
            isOneToOne: false
            referencedRelation: "billing_customers"
            referencedColumns: ["gateway_customer_id"]
          },
        ]
      }
      billing_volume_tiers: {
        Row: {
          gateway_price_id: string
          id: string
          max_quantity: number | null
          min_quantity: number
          unit_price: number
        }
        Insert: {
          gateway_price_id: string
          id?: string
          max_quantity?: number | null
          min_quantity: number
          unit_price: number
        }
        Update: {
          gateway_price_id?: string
          id?: string
          max_quantity?: number | null
          min_quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_volume_tiers_gateway_price_id_fkey"
            columns: ["gateway_price_id"]
            isOneToOne: false
            referencedRelation: "billing_prices"
            referencedColumns: ["gateway_price_id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          payload: Json | null
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          payload?: Json | null
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          call_center_employee_id: string | null
          created_at: string | null
          customer_code: string
          email: string | null
          full_name: string
          has_visited: boolean | null
          id: string
          phone: string
          updated_at: string | null
          visit_date: string | null
        }
        Insert: {
          address?: string | null
          call_center_employee_id?: string | null
          created_at?: string | null
          customer_code: string
          email?: string | null
          full_name: string
          has_visited?: boolean | null
          id?: string
          phone: string
          updated_at?: string | null
          visit_date?: string | null
        }
        Update: {
          address?: string | null
          call_center_employee_id?: string | null
          created_at?: string | null
          customer_code?: string
          email?: string | null
          full_name?: string
          has_visited?: boolean | null
          id?: string
          phone?: string
          updated_at?: string | null
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_call_center_employee_id_fkey"
            columns: ["call_center_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      device_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          device_id: string
          id: string
          new_status: Database["public"]["Enums"]["device_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["device_status"] | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          device_id: string
          id?: string
          new_status: Database["public"]["Enums"]["device_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["device_status"] | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          device_id?: string
          id?: string
          new_status?: Database["public"]["Enums"]["device_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["device_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "device_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_status_history_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          actual_cost: number | null
          assigned_technician_id: string | null
          brand: string | null
          completed_date: string | null
          created_at: string | null
          customer_id: string
          delivered_date: string | null
          device_type: string
          estimated_cost: number | null
          id: string
          model: string | null
          notes: string | null
          problem_description: string
          received_date: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["device_status"] | null
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          assigned_technician_id?: string | null
          brand?: string | null
          completed_date?: string | null
          created_at?: string | null
          customer_id: string
          delivered_date?: string | null
          device_type: string
          estimated_cost?: number | null
          id?: string
          model?: string | null
          notes?: string | null
          problem_description: string
          received_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["device_status"] | null
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          assigned_technician_id?: string | null
          brand?: string | null
          completed_date?: string | null
          created_at?: string | null
          customer_id?: string
          delivered_date?: string | null
          device_type?: string
          estimated_cost?: number | null
          id?: string
          model?: string | null
          notes?: string | null
          problem_description?: string
          received_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["device_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          application_form: string | null
          birth_certificate: string | null
          created_at: string | null
          documents_complete: boolean | null
          documents_verified: boolean | null
          employee_id: string
          id: string
          id_card_back: string | null
          id_card_front: string | null
          military_certificate: string | null
          notes: string | null
          qualification_certificate: string | null
          updated_at: string | null
          utility_bill: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          application_form?: string | null
          birth_certificate?: string | null
          created_at?: string | null
          documents_complete?: boolean | null
          documents_verified?: boolean | null
          employee_id: string
          id?: string
          id_card_back?: string | null
          id_card_front?: string | null
          military_certificate?: string | null
          notes?: string | null
          qualification_certificate?: string | null
          updated_at?: string | null
          utility_bill?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          application_form?: string | null
          birth_certificate?: string | null
          created_at?: string | null
          documents_complete?: boolean | null
          documents_verified?: boolean | null
          employee_id?: string
          id?: string
          id_card_back?: string | null
          id_card_front?: string | null
          military_certificate?: string | null
          notes?: string | null
          qualification_certificate?: string | null
          updated_at?: string | null
          utility_bill?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_evaluations: {
        Row: {
          average_score: number | null
          commitment_score: number | null
          created_at: string | null
          customer_service_score: number | null
          employee_id: string
          evaluated_by: string
          evaluated_by_name: string | null
          evaluation_month: number
          evaluation_year: number
          grade: string | null
          id: string
          improvement_suggestions: string | null
          innovation_score: number | null
          manager_comments: string | null
          performance_score: number | null
          status: string | null
          strengths: string | null
          teamwork_score: number | null
          updated_at: string | null
          weaknesses: string | null
        }
        Insert: {
          average_score?: number | null
          commitment_score?: number | null
          created_at?: string | null
          customer_service_score?: number | null
          employee_id: string
          evaluated_by: string
          evaluated_by_name?: string | null
          evaluation_month: number
          evaluation_year: number
          grade?: string | null
          id?: string
          improvement_suggestions?: string | null
          innovation_score?: number | null
          manager_comments?: string | null
          performance_score?: number | null
          status?: string | null
          strengths?: string | null
          teamwork_score?: number | null
          updated_at?: string | null
          weaknesses?: string | null
        }
        Update: {
          average_score?: number | null
          commitment_score?: number | null
          created_at?: string | null
          customer_service_score?: number | null
          employee_id?: string
          evaluated_by?: string
          evaluated_by_name?: string | null
          evaluation_month?: number
          evaluation_year?: number
          grade?: string | null
          id?: string
          improvement_suggestions?: string | null
          innovation_score?: number | null
          manager_comments?: string | null
          performance_score?: number | null
          status?: string | null
          strengths?: string | null
          teamwork_score?: number | null
          updated_at?: string | null
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_orientations: {
        Row: {
          attachments: string[] | null
          completion_percentage: number | null
          conducted_by: string | null
          conducted_by_name: string | null
          created_at: string | null
          duration_hours: number | null
          employee_id: string
          id: string
          notes: string | null
          orientation_date: string
          orientation_description: string | null
          orientation_title: string
          orientation_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          completion_percentage?: number | null
          conducted_by?: string | null
          conducted_by_name?: string | null
          created_at?: string | null
          duration_hours?: number | null
          employee_id: string
          id?: string
          notes?: string | null
          orientation_date: string
          orientation_description?: string | null
          orientation_title: string
          orientation_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          completion_percentage?: number | null
          conducted_by?: string | null
          conducted_by_name?: string | null
          created_at?: string | null
          duration_hours?: number | null
          employee_id?: string
          id?: string
          notes?: string | null
          orientation_date?: string
          orientation_description?: string | null
          orientation_title?: string
          orientation_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_orientations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_penalties: {
        Row: {
          applied_by: string
          applied_by_name: string | null
          applied_date: string | null
          approved_at: string | null
          approved_by: string | null
          attachments: string[] | null
          created_at: string | null
          deduction_amount: number
          employee_id: string
          employee_response: string | null
          id: string
          incident_date: string
          incident_time: string | null
          notes: string | null
          penalty_description: string | null
          penalty_title: string
          penalty_type: string
          requires_approval: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          applied_by: string
          applied_by_name?: string | null
          applied_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: string[] | null
          created_at?: string | null
          deduction_amount?: number
          employee_id: string
          employee_response?: string | null
          id?: string
          incident_date: string
          incident_time?: string | null
          notes?: string | null
          penalty_description?: string | null
          penalty_title: string
          penalty_type: string
          requires_approval?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          applied_by?: string
          applied_by_name?: string | null
          applied_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: string[] | null
          created_at?: string | null
          deduction_amount?: number
          employee_id?: string
          employee_response?: string | null
          id?: string
          incident_date?: string
          incident_time?: string | null
          notes?: string | null
          penalty_description?: string | null
          penalty_title?: string
          penalty_type?: string
          requires_approval?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_penalties_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_tests: {
        Row: {
          attachments: string[] | null
          completion_date: string | null
          conducted_by: string | null
          conducted_by_name: string | null
          created_at: string | null
          employee_id: string
          feedback: string | null
          id: string
          notes: string | null
          obtained_score: number
          passed: boolean | null
          passing_score: number
          percentage: number | null
          status: string | null
          test_date: string
          test_description: string | null
          test_title: string
          test_type: string | null
          total_score: number
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          completion_date?: string | null
          conducted_by?: string | null
          conducted_by_name?: string | null
          created_at?: string | null
          employee_id: string
          feedback?: string | null
          id?: string
          notes?: string | null
          obtained_score?: number
          passed?: boolean | null
          passing_score?: number
          percentage?: number | null
          status?: string | null
          test_date: string
          test_description?: string | null
          test_title: string
          test_type?: string | null
          total_score?: number
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          completion_date?: string | null
          conducted_by?: string | null
          conducted_by_name?: string | null
          created_at?: string | null
          employee_id?: string
          feedback?: string | null
          id?: string
          notes?: string | null
          obtained_score?: number
          passed?: boolean | null
          passing_score?: number
          percentage?: number | null
          status?: string | null
          test_date?: string
          test_description?: string | null
          test_title?: string
          test_type?: string | null
          total_score?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_tests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_type_roles: {
        Row: {
          created_at: string | null
          employee_type_id: string | null
          id: string
          role_name: string
        }
        Insert: {
          created_at?: string | null
          employee_type_id?: string | null
          id?: string
          role_name: string
        }
        Update: {
          created_at?: string | null
          employee_type_id?: string | null
          id?: string
          role_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_type_roles_employee_type_id_fkey"
            columns: ["employee_type_id"]
            isOneToOne: false
            referencedRelation: "employee_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_type_roles_role_name_fkey"
            columns: ["role_name"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
          },
        ]
      }
      employee_types: {
        Row: {
          code_prefix: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code_prefix: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code_prefix?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          address: string | null
          address_verified: boolean | null
          address_verified_date: string | null
          application_date: string | null
          base_salary: number | null
          company_phone: string | null
          created_at: string | null
          daily_salary: number | null
          date_of_birth: string | null
          email: string
          employee_code: string
          employee_type_id: string
          full_name: string
          gender: string | null
          hire_date: string | null
          id: string
          initial_test_score: number | null
          is_active: boolean | null
          personal_phone: string | null
          phone: string | null
          profile_photo_url: string | null
          qualification_level: string | null
          qualification_name: string | null
          relative_name: string | null
          relative_phone: string | null
          relative_relation: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          address_verified?: boolean | null
          address_verified_date?: string | null
          application_date?: string | null
          base_salary?: number | null
          company_phone?: string | null
          created_at?: string | null
          daily_salary?: number | null
          date_of_birth?: string | null
          email: string
          employee_code: string
          employee_type_id: string
          full_name: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          initial_test_score?: number | null
          is_active?: boolean | null
          personal_phone?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          qualification_level?: string | null
          qualification_name?: string | null
          relative_name?: string | null
          relative_phone?: string | null
          relative_relation?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          address_verified?: boolean | null
          address_verified_date?: string | null
          application_date?: string | null
          base_salary?: number | null
          company_phone?: string | null
          created_at?: string | null
          daily_salary?: number | null
          date_of_birth?: string | null
          email?: string
          employee_code?: string
          employee_type_id?: string
          full_name?: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          initial_test_score?: number | null
          is_active?: boolean | null
          personal_phone?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          qualification_level?: string | null
          qualification_name?: string | null
          relative_name?: string | null
          relative_phone?: string | null
          relative_relation?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_employee_type_id_fkey"
            columns: ["employee_type_id"]
            isOneToOne: false
            referencedRelation: "employee_types"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string | null
          holiday_date: string
          holiday_name: string
          id: string
          is_recurring: boolean | null
        }
        Insert: {
          created_at?: string | null
          holiday_date: string
          holiday_name: string
          id?: string
          is_recurring?: boolean | null
        }
        Update: {
          created_at?: string | null
          holiday_date?: string
          holiday_name?: string
          id?: string
          is_recurring?: boolean | null
        }
        Relationships: []
      }
      incentive_rules: {
        Row: {
          conditions: string | null
          created_at: string | null
          description: string | null
          employee_type_id: string
          id: string
          incentive_amount: number
          incentive_name: string
          incentive_type: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          conditions?: string | null
          created_at?: string | null
          description?: string | null
          employee_type_id: string
          id?: string
          incentive_amount?: number
          incentive_name: string
          incentive_type: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          conditions?: string | null
          created_at?: string | null
          description?: string | null
          employee_type_id?: string
          id?: string
          incentive_amount?: number
          incentive_name?: string
          incentive_type?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incentive_rules_employee_type_id_fkey"
            columns: ["employee_type_id"]
            isOneToOne: false
            referencedRelation: "employee_types"
            referencedColumns: ["id"]
          },
        ]
      }
      incentive_settings: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          incentive_type: Database["public"]["Enums"]["incentive_type"]
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          incentive_type: Database["public"]["Enums"]["incentive_type"]
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          incentive_type?: Database["public"]["Enums"]["incentive_type"]
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      incentives: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          employee_id: string
          id: string
          incentive_type: Database["public"]["Enums"]["incentive_type"]
          is_paid: boolean | null
          paid_date: string | null
          reference_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          employee_id: string
          id?: string
          incentive_type: Database["public"]["Enums"]["incentive_type"]
          is_paid?: boolean | null
          paid_date?: string | null
          reference_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          employee_id?: string
          id?: string
          incentive_type?: Database["public"]["Enums"]["incentive_type"]
          is_paid?: boolean | null
          paid_date?: string | null
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incentives_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balance: {
        Row: {
          annual_leave_remaining: number | null
          annual_leave_total: number | null
          annual_leave_used: number | null
          created_at: string | null
          emergency_leave_remaining: number | null
          emergency_leave_total: number | null
          emergency_leave_used: number | null
          employee_id: string
          id: string
          sick_leave_remaining: number | null
          sick_leave_total: number | null
          sick_leave_used: number | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          annual_leave_remaining?: number | null
          annual_leave_total?: number | null
          annual_leave_used?: number | null
          created_at?: string | null
          emergency_leave_remaining?: number | null
          emergency_leave_total?: number | null
          emergency_leave_used?: number | null
          employee_id: string
          id?: string
          sick_leave_remaining?: number | null
          sick_leave_total?: number | null
          sick_leave_used?: number | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          annual_leave_remaining?: number | null
          annual_leave_total?: number | null
          annual_leave_used?: number | null
          created_at?: string | null
          emergency_leave_remaining?: number | null
          emergency_leave_total?: number | null
          emergency_leave_used?: number | null
          employee_id?: string
          id?: string
          sick_leave_remaining?: number | null
          sick_leave_total?: number | null
          sick_leave_used?: number | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_balance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          attachments: string[] | null
          created_at: string | null
          days_count: number | null
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          notes: string | null
          reason: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_by_name: string | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string | null
          days_count?: number | null
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          notes?: string | null
          reason: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_name?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          created_at?: string | null
          days_count?: number | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          notes?: string | null
          reason?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_name?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_author_profiles: {
        Row: {
          avatar_url: string
          bio: string
          created_at: string
          display_name: string
          facebook_handle: string | null
          id: string
          instagram_handle: string | null
          linkedin_handle: string | null
          slug: string
          twitter_handle: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          avatar_url: string
          bio: string
          created_at?: string
          display_name: string
          facebook_handle?: string | null
          id?: string
          instagram_handle?: string | null
          linkedin_handle?: string | null
          slug: string
          twitter_handle?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string
          bio?: string
          created_at?: string
          display_name?: string
          facebook_handle?: string | null
          id?: string
          instagram_handle?: string | null
          linkedin_handle?: string | null
          slug?: string
          twitter_handle?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      marketing_blog_author_posts: {
        Row: {
          author_id: string
          post_id: string
        }
        Insert: {
          author_id: string
          post_id: string
        }
        Update: {
          author_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_blog_author_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "marketing_author_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_blog_author_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "marketing_blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_blog_post_tags_relationship: {
        Row: {
          blog_post_id: string
          tag_id: string
        }
        Insert: {
          blog_post_id: string
          tag_id: string
        }
        Update: {
          blog_post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_blog_post_tags_relationship_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "marketing_blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_blog_post_tags_relationship_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "marketing_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_blog_posts: {
        Row: {
          content: string
          cover_image: string | null
          created_at: string
          id: string
          is_featured: boolean
          json_content: Json
          seo_data: Json | null
          slug: string
          status: Database["public"]["Enums"]["marketing_blog_post_status"]
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          cover_image?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          json_content?: Json
          seo_data?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["marketing_blog_post_status"]
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          cover_image?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          json_content?: Json
          seo_data?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["marketing_blog_post_status"]
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_changelog: {
        Row: {
          cover_image: string | null
          created_at: string | null
          id: string
          json_content: Json
          status: Database["public"]["Enums"]["marketing_changelog_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string | null
          id?: string
          json_content?: Json
          status?: Database["public"]["Enums"]["marketing_changelog_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string | null
          id?: string
          json_content?: Json
          status?: Database["public"]["Enums"]["marketing_changelog_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_changelog_author_relationship: {
        Row: {
          author_id: string
          changelog_id: string
        }
        Insert: {
          author_id: string
          changelog_id: string
        }
        Update: {
          author_id?: string
          changelog_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_changelog_author_relationship_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "marketing_author_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_changelog_author_relationship_changelog_id_fkey"
            columns: ["changelog_id"]
            isOneToOne: false
            referencedRelation: "marketing_changelog"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_feedback_board_subscriptions: {
        Row: {
          board_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_feedback_board_subscriptions_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "marketing_feedback_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_feedback_board_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_feedback_boards: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          settings: Json
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          settings?: Json
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          settings?: Json
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_feedback_boards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_feedback_comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction_type: Database["public"]["Enums"]["marketing_feedback_reaction_type"]
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction_type: Database["public"]["Enums"]["marketing_feedback_reaction_type"]
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction_type?: Database["public"]["Enums"]["marketing_feedback_reaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_feedback_comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "marketing_feedback_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_feedback_comment_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_feedback_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          moderator_hold_category:
            | Database["public"]["Enums"]["marketing_feedback_moderator_hold_category"]
            | null
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          moderator_hold_category?:
            | Database["public"]["Enums"]["marketing_feedback_moderator_hold_category"]
            | null
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          moderator_hold_category?:
            | Database["public"]["Enums"]["marketing_feedback_moderator_hold_category"]
            | null
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_feedback_comments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "marketing_feedback_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_feedback_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_feedback_thread_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: Database["public"]["Enums"]["marketing_feedback_reaction_type"]
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type: Database["public"]["Enums"]["marketing_feedback_reaction_type"]
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: Database["public"]["Enums"]["marketing_feedback_reaction_type"]
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_feedback_thread_reactions_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "marketing_feedback_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_feedback_thread_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_feedback_thread_subscriptions: {
        Row: {
          created_at: string
          id: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_feedback_thread_subscriptions_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "marketing_feedback_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_feedback_thread_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_feedback_threads: {
        Row: {
          added_to_roadmap: boolean
          board_id: string | null
          content: string
          created_at: string
          id: string
          is_publicly_visible: boolean
          moderator_hold_category:
            | Database["public"]["Enums"]["marketing_feedback_moderator_hold_category"]
            | null
          open_for_public_discussion: boolean
          priority: Database["public"]["Enums"]["marketing_feedback_thread_priority"]
          status: Database["public"]["Enums"]["marketing_feedback_thread_status"]
          title: string
          type: Database["public"]["Enums"]["marketing_feedback_thread_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          added_to_roadmap?: boolean
          board_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_publicly_visible?: boolean
          moderator_hold_category?:
            | Database["public"]["Enums"]["marketing_feedback_moderator_hold_category"]
            | null
          open_for_public_discussion?: boolean
          priority?: Database["public"]["Enums"]["marketing_feedback_thread_priority"]
          status?: Database["public"]["Enums"]["marketing_feedback_thread_status"]
          title: string
          type?: Database["public"]["Enums"]["marketing_feedback_thread_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          added_to_roadmap?: boolean
          board_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_publicly_visible?: boolean
          moderator_hold_category?:
            | Database["public"]["Enums"]["marketing_feedback_moderator_hold_category"]
            | null
          open_for_public_discussion?: boolean
          priority?: Database["public"]["Enums"]["marketing_feedback_thread_priority"]
          status?: Database["public"]["Enums"]["marketing_feedback_thread_status"]
          title?: string
          type?: Database["public"]["Enums"]["marketing_feedback_thread_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_feedback_threads_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "marketing_feedback_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_feedback_threads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_tags: {
        Row: {
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      penalty_rules: {
        Row: {
          calculation_method: string | null
          created_at: string | null
          default_amount: number
          description: string | null
          id: string
          is_active: boolean | null
          penalty_type: string
          requires_manager_approval: boolean | null
          rule_name: string
          updated_at: string | null
        }
        Insert: {
          calculation_method?: string | null
          created_at?: string | null
          default_amount?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          penalty_type: string
          requires_manager_approval?: boolean | null
          rule_name: string
          updated_at?: string | null
        }
        Update: {
          calculation_method?: string | null
          created_at?: string | null
          default_amount?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          penalty_type?: string
          requires_manager_approval?: boolean | null
          rule_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_comments: {
        Row: {
          created_at: string | null
          id: string
          in_reply_to: string | null
          project_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          in_reply_to?: string | null
          project_id: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          in_reply_to?: string | null
          project_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_in_reply_to_fkey"
            columns: ["in_reply_to"]
            isOneToOne: false
            referencedRelation: "project_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          project_status: Database["public"]["Enums"]["project_status"]
          slug: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_status?: Database["public"]["Enums"]["project_status"]
          slug?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_status?: Database["public"]["Enums"]["project_status"]
          slug?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          level: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          level?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          level?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          is_revoked: boolean
          key_id: string
          masked_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          is_revoked?: boolean
          key_id: string
          masked_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          is_revoked?: boolean
          key_id?: string
          masked_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_application_settings: {
        Row: {
          email_readonly: string
          id: string
        }
        Insert: {
          email_readonly: string
          id: string
        }
        Update: {
          email_readonly?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_application_settings_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          is_seen: boolean
          payload: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          is_seen?: boolean
          payload?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          is_seen?: boolean
          payload?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_new_role_name_fkey"
            columns: ["role_name"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
          },
        ]
      }
      user_settings: {
        Row: {
          default_workspace: string | null
          id: string
        }
        Insert: {
          default_workspace?: string | null
          id: string
        }
        Update: {
          default_workspace?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_default_workspace_fkey"
            columns: ["default_workspace"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_settings_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          resolved_at: string | null
          severity: string
          vehicle_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          resolved_at?: string | null
          severity?: string
          vehicle_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          resolved_at?: string | null
          severity?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_fueling: {
        Row: {
          amount_paid: number
          created_at: string | null
          driver_id: string
          fueling_date: string
          fueling_time: string
          id: string
          liters: number
          odometer_reading: number | null
          photo_url: string | null
          vehicle_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          driver_id: string
          fueling_date?: string
          fueling_time?: string
          id?: string
          liters: number
          odometer_reading?: number | null
          photo_url?: string | null
          vehicle_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          driver_id?: string
          fueling_date?: string
          fueling_time?: string
          id?: string
          liters?: number
          odometer_reading?: number | null
          photo_url?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_fueling_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_fueling_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_incidents: {
        Row: {
          created_at: string | null
          description: string
          driver_id: string | null
          id: string
          incident_date: string
          incident_type: string
          photos_urls: string[] | null
          repair_cost: number | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          driver_id?: string | null
          id?: string
          incident_date: string
          incident_type: string
          photos_urls?: string[] | null
          repair_cost?: number | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          driver_id?: string | null
          id?: string
          incident_date?: string
          incident_type?: string
          photos_urls?: string[] | null
          repair_cost?: number | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_incidents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_incidents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_insurance: {
        Row: {
          amount: number | null
          created_at: string | null
          document_url: string | null
          end_date: string
          id: string
          insurance_company: string | null
          policy_number: string | null
          start_date: string
          vehicle_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          document_url?: string | null
          end_date: string
          id?: string
          insurance_company?: string | null
          policy_number?: string | null
          start_date: string
          vehicle_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          document_url?: string | null
          end_date?: string
          id?: string
          insurance_company?: string | null
          policy_number?: string | null
          start_date?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_insurance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_maintenance: {
        Row: {
          amount_paid: number
          created_at: string | null
          description: string | null
          driver_id: string
          id: string
          maintenance_date: string
          maintenance_type: string
          next_maintenance_km: number | null
          odometer_reading: number
          vehicle_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          description?: string | null
          driver_id: string
          id?: string
          maintenance_date?: string
          maintenance_type: string
          next_maintenance_km?: number | null
          odometer_reading: number
          vehicle_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          description?: string | null
          driver_id?: string
          id?: string
          maintenance_date?: string
          maintenance_type?: string
          next_maintenance_km?: number | null
          odometer_reading?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_odometer_readings: {
        Row: {
          created_at: string | null
          driver_id: string
          id: string
          photo_url: string | null
          reading_date: string
          reading_time: string
          reading_type: string
          reading_value: number
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          driver_id: string
          id?: string
          photo_url?: string | null
          reading_date?: string
          reading_time?: string
          reading_type: string
          reading_value: number
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          driver_id?: string
          id?: string
          photo_url?: string | null
          reading_date?: string
          reading_time?: string
          reading_type?: string
          reading_value?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_odometer_readings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_odometer_readings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_trips: {
        Row: {
          client_name: string
          created_at: string | null
          delivery_location: string
          delivery_time: string | null
          driver_id: string
          id: string
          items_description: string | null
          items_photo_url: string | null
          pickup_location: string
          pickup_time: string | null
          representative_id: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          client_name: string
          created_at?: string | null
          delivery_location: string
          delivery_time?: string | null
          driver_id: string
          id?: string
          items_description?: string | null
          items_photo_url?: string | null
          pickup_location: string
          pickup_time?: string | null
          representative_id?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          client_name?: string
          created_at?: string | null
          delivery_location?: string
          delivery_time?: string | null
          driver_id?: string
          id?: string
          items_description?: string | null
          items_photo_url?: string | null
          pickup_location?: string
          pickup_time?: string | null
          representative_id?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_trips_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_violations: {
        Row: {
          amount: number
          created_at: string | null
          driver_id: string | null
          id: string
          photo_url: string | null
          status: string | null
          vehicle_id: string
          violation_date: string
          violation_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          driver_id?: string | null
          id?: string
          photo_url?: string | null
          status?: string | null
          vehicle_id: string
          violation_date: string
          violation_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          driver_id?: string | null
          id?: string
          photo_url?: string | null
          status?: string | null
          vehicle_id?: string
          violation_date?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_violations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_violations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          back_photo_url: string | null
          chassis_number: string
          created_at: string | null
          driver_id: string | null
          front_photo_url: string | null
          id: string
          left_photo_url: string | null
          license_issue_date: string | null
          license_photo_url: string | null
          license_renewal_date: string | null
          representative_id: string | null
          right_photo_url: string | null
          status: string | null
          updated_at: string | null
          vehicle_number: string
        }
        Insert: {
          back_photo_url?: string | null
          chassis_number: string
          created_at?: string | null
          driver_id?: string | null
          front_photo_url?: string | null
          id?: string
          left_photo_url?: string | null
          license_issue_date?: string | null
          license_photo_url?: string | null
          license_renewal_date?: string | null
          representative_id?: string | null
          right_photo_url?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_number: string
        }
        Update: {
          back_photo_url?: string | null
          chassis_number?: string
          created_at?: string | null
          driver_id?: string | null
          front_photo_url?: string | null
          id?: string
          left_photo_url?: string | null
          license_issue_date?: string | null
          license_photo_url?: string | null
          license_renewal_date?: string | null
          representative_id?: string | null
          right_photo_url?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          created_at: string | null
          day_of_week: number
          employee_id: string
          end_time: string
          id: string
          is_working_day: boolean | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          employee_id: string
          end_time: string
          id?: string
          is_working_day?: boolean | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          employee_id?: string
          end_time?: string
          id?: string
          is_working_day?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_admin_settings: {
        Row: {
          workspace_id: string
          workspace_settings: Json
        }
        Insert: {
          workspace_id: string
          workspace_settings?: Json
        }
        Update: {
          workspace_id?: string
          workspace_settings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "workspace_admin_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_application_settings: {
        Row: {
          membership_type: Database["public"]["Enums"]["workspace_membership_type"]
          workspace_id: string
        }
        Insert: {
          membership_type?: Database["public"]["Enums"]["workspace_membership_type"]
          workspace_id: string
        }
        Update: {
          membership_type?: Database["public"]["Enums"]["workspace_membership_type"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_application_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_credits: {
        Row: {
          credits: number
          id: string
          last_reset_date: string | null
          workspace_id: string
        }
        Insert: {
          credits?: number
          id?: string
          last_reset_date?: string | null
          workspace_id: string
        }
        Update: {
          credits?: number
          id?: string
          last_reset_date?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_credits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_credits_logs: {
        Row: {
          change_type: string
          changed_at: string
          id: string
          new_credits: number | null
          old_credits: number | null
          workspace_credits_id: string
          workspace_id: string
        }
        Insert: {
          change_type: string
          changed_at?: string
          id?: string
          new_credits?: number | null
          old_credits?: number | null
          workspace_credits_id: string
          workspace_id: string
        }
        Update: {
          change_type?: string
          changed_at?: string
          id?: string
          new_credits?: number | null
          old_credits?: number | null
          workspace_credits_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_credits_logs_workspace_credits_id_fkey"
            columns: ["workspace_credits_id"]
            isOneToOne: false
            referencedRelation: "workspace_credits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_credits_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          created_at: string
          id: string
          invitee_user_email: string
          invitee_user_id: string | null
          invitee_user_role: Database["public"]["Enums"]["workspace_member_role_type"]
          inviter_user_id: string
          status: Database["public"]["Enums"]["workspace_invitation_link_status"]
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitee_user_email: string
          invitee_user_id?: string | null
          invitee_user_role?: Database["public"]["Enums"]["workspace_member_role_type"]
          inviter_user_id: string
          status?: Database["public"]["Enums"]["workspace_invitation_link_status"]
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invitee_user_email?: string
          invitee_user_id?: string | null
          invitee_user_role?: Database["public"]["Enums"]["workspace_member_role_type"]
          inviter_user_id?: string
          status?: Database["public"]["Enums"]["workspace_invitation_link_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_invitee_user_id_fkey"
            columns: ["invitee_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_inviter_user_id_fkey"
            columns: ["inviter_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          added_at: string
          id: string
          permissions: Json
          workspace_id: string
          workspace_member_id: string
          workspace_member_role: Database["public"]["Enums"]["workspace_member_role_type"]
        }
        Insert: {
          added_at?: string
          id?: string
          permissions?: Json
          workspace_id: string
          workspace_member_id: string
          workspace_member_role: Database["public"]["Enums"]["workspace_member_role_type"]
        }
        Update: {
          added_at?: string
          id?: string
          permissions?: Json
          workspace_id?: string
          workspace_member_id?: string
          workspace_member_role?: Database["public"]["Enums"]["workspace_member_role_type"]
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_member_id_fkey"
            columns: ["workspace_member_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          workspace_id: string
          workspace_settings: Json
        }
        Insert: {
          workspace_id: string
          workspace_settings?: Json
        }
        Update: {
          workspace_id?: string
          workspace_settings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_admin_get_projects_created_per_month: {
        Args: never
        Returns: {
          month: string
          number_of_projects: number
        }[]
      }
      app_admin_get_recent_30_day_signin_count: { Args: never; Returns: number }
      app_admin_get_total_organization_count: { Args: never; Returns: number }
      app_admin_get_total_project_count: { Args: never; Returns: number }
      app_admin_get_total_user_count: { Args: never; Returns: number }
      app_admin_get_user_id_by_email: {
        Args: { emailarg: string }
        Returns: string
      }
      app_admin_get_users_created_per_month: {
        Args: never
        Returns: {
          month: string
          number_of_users: number
        }[]
      }
      app_admin_get_workspaces_created_per_month: {
        Args: never
        Returns: {
          month: string
          number_of_workspaces: number
        }[]
      }
      calculate_daily_salary: {
        Args: { p_employee_id: string }
        Returns: number
      }
      calculate_fuel_efficiency: {
        Args: { p_days?: number; p_vehicle_id: string }
        Returns: {
          avg_km_per_liter: number
          total_cost: number
          total_distance: number
          total_liters: number
        }[]
      }
      check_documents_complete: {
        Args: { p_employee_id: string }
        Returns: boolean
      }
      check_fuel_consumption_alerts: { Args: never; Returns: undefined }
      check_if_authenticated_user_owns_email: {
        Args: { email: string }
        Returns: boolean
      }
      check_leave_conflict: {
        Args: {
          p_employee_id: string
          p_end_date: string
          p_start_date: string
        }
        Returns: boolean
      }
      check_license_renewal_alerts: { Args: never; Returns: undefined }
      check_maintenance_alerts: { Args: never; Returns: undefined }
      compare_employee_performance: {
        Args: {
          p_employee_id: string
          p_month1: number
          p_month2: number
          p_year1: number
          p_year2: number
        }
        Returns: {
          difference: number
          improvement_percentage: number
          month1_score: number
          month2_score: number
        }[]
      }
      create_leave_balance_for_employee: {
        Args: { p_employee_id: string }
        Returns: undefined
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      decrement_credits: {
        Args: { amount: number; org_id: string }
        Returns: undefined
      }
      get_all_check_constraints: {
        Args: never
        Returns: {
          check_clause: string
          constraint_name: string
          table_name: string
        }[]
      }
      get_all_columns: {
        Args: never
        Returns: {
          character_maximum_length: number
          column_default: string
          column_name: string
          data_type: string
          is_nullable: string
          numeric_precision: number
          numeric_scale: number
          ordinal_position: number
          table_name: string
          udt_name: string
        }[]
      }
      get_all_foreign_keys: {
        Args: never
        Returns: {
          constraint_name: string
          delete_rule: string
          from_column: string
          from_table: string
          to_column: string
          to_table: string
          update_rule: string
        }[]
      }
      get_all_indexes: {
        Args: never
        Returns: {
          indexdef: string
          indexname: string
          schemaname: string
          tablename: string
        }[]
      }
      get_all_primary_keys: {
        Args: never
        Returns: {
          column_name: string
          constraint_name: string
          table_name: string
        }[]
      }
      get_all_rls_policies: {
        Args: never
        Returns: {
          cmd: string
          permissive: string
          policyname: string
          qual: string
          roles: string[]
          schemaname: string
          tablename: string
          with_check: string
        }[]
      }
      get_all_tables: {
        Args: never
        Returns: {
          table_name: string
          table_type: string
        }[]
      }
      get_all_unique_constraints: {
        Args: never
        Returns: {
          column_name: string
          constraint_name: string
          table_name: string
        }[]
      }
      get_all_views: {
        Args: never
        Returns: {
          table_name: string
          view_definition: string
        }[]
      }
      get_customer_workspace_id: {
        Args: { customer_id_arg: string }
        Returns: string
      }
      get_employee_average_evaluation: {
        Args: { p_employee_id: string }
        Returns: number
      }
      get_employee_average_test_score: {
        Args: { p_employee_id: string }
        Returns: number
      }
      get_employee_completed_orientations_count: {
        Args: { p_employee_id: string }
        Returns: number
      }
      get_employee_evaluation_stats: {
        Args: { p_employee_id: string }
        Returns: {
          acceptable_count: number
          average_score: number
          best_score: number
          excellent_count: number
          good_count: number
          poor_count: number
          total_evaluations: number
          very_good_count: number
          worst_score: number
        }[]
      }
      get_employee_failed_tests_count: {
        Args: { p_employee_id: string }
        Returns: number
      }
      get_employee_latest_evaluation: {
        Args: { p_employee_id: string }
        Returns: {
          average: number
          commitment: number
          customer_service: number
          grade: string
          innovation: number
          month: number
          performance: number
          teamwork: number
          year: number
        }[]
      }
      get_employee_leave_balance: {
        Args: { p_employee_id: string }
        Returns: {
          annual_remaining: number
          annual_total: number
          annual_used: number
          emergency_remaining: number
          emergency_total: number
          emergency_used: number
          sick_remaining: number
          sick_total: number
          sick_used: number
        }[]
      }
      get_employee_leave_stats: {
        Args: { p_employee_id: string }
        Returns: {
          approved_requests: number
          pending_requests: number
          rejected_requests: number
          total_days_taken: number
          total_requests: number
        }[]
      }
      get_employee_monthly_penalties: {
        Args: { p_employee_id: string; p_month: number; p_year: number }
        Returns: number
      }
      get_employee_passed_tests_count: {
        Args: { p_employee_id: string }
        Returns: number
      }
      get_employee_penalties_by_type: {
        Args: { p_employee_id: string; p_penalty_type: string }
        Returns: number
      }
      get_employee_penalties_report: {
        Args: { p_employee_id: string }
        Returns: {
          absence_count: number
          error_count: number
          last_penalty_date: string
          late_count: number
          total_deductions: number
          total_penalties: number
        }[]
      }
      get_employee_total_incentives: {
        Args: { p_employee_id: string }
        Returns: number
      }
      get_employee_total_penalties: {
        Args: { p_employee_id: string }
        Returns: number
      }
      get_employee_training_report: {
        Args: { p_employee_id: string }
        Returns: {
          average_score: number
          completed_orientations: number
          failed_tests: number
          passed_tests: number
          total_orientations: number
          total_tests: number
        }[]
      }
      get_employee_yearly_evaluations: {
        Args: { p_employee_id: string; p_year: number }
        Returns: {
          average: number
          grade: string
          month: number
        }[]
      }
      get_project_workspace_uuid: {
        Args: { project_id: string }
        Returns: string
      }
      get_user_role: { Args: { p_user_id: string }; Returns: string }
      get_workspace_team_member_admins: {
        Args: { workspace_id: string }
        Returns: {
          member_id: string
        }[]
      }
      get_workspace_team_member_ids: {
        Args: { workspace_id: string }
        Returns: {
          member_id: string
        }[]
      }
      has_any_role: {
        Args: { p_roles: string[]; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: boolean
      }
      has_role_level: {
        Args: { p_min_level: number; p_user_id: string }
        Returns: boolean
      }
      has_workspace_permission: {
        Args: { permission: string; user_id: string; workspace_id: string }
        Returns: boolean
      }
      is_application_admin: { Args: { user_id?: string }; Returns: boolean }
      is_eligible_for_leave: {
        Args: { p_employee_id: string }
        Returns: boolean
      }
      is_workspace_admin: {
        Args: { user_id: string; workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { user_id: string; workspace_id: string }
        Returns: boolean
      }
      make_user_app_admin: { Args: { user_id_arg: string }; Returns: undefined }
      remove_app_admin_privilege_for_user: {
        Args: { user_id_arg: string }
        Returns: undefined
      }
      run_vehicle_alerts_check: { Args: never; Returns: undefined }
      update_workspace_member_permissions: {
        Args: { member_id: string; new_permissions: Json; workspace_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin"
      device_status:
        | "pending"
        | "in_progress"
        | "waiting_parts"
        | "completed"
        | "delivered"
        | "cancelled"
      incentive_type:
        | "customer_visit"
        | "on_time_attendance"
        | "holiday_work"
        | "overtime"
        | "monthly_target"
        | "customer_registration"
      marketing_blog_post_status: "draft" | "published"
      marketing_changelog_status: "draft" | "published"
      marketing_feedback_moderator_hold_category:
        | "spam"
        | "off_topic"
        | "inappropriate"
        | "other"
      marketing_feedback_reaction_type:
        | "like"
        | "heart"
        | "celebrate"
        | "upvote"
      marketing_feedback_thread_priority: "low" | "medium" | "high"
      marketing_feedback_thread_status:
        | "open"
        | "under_review"
        | "planned"
        | "closed"
        | "in_progress"
        | "completed"
        | "moderator_hold"
      marketing_feedback_thread_type: "bug" | "feature_request" | "general"
      organization_joining_status:
        | "invited"
        | "joinied"
        | "declined_invitation"
        | "joined"
      organization_member_role: "owner" | "admin" | "member" | "readonly"
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      project_status: "draft" | "pending_approval" | "approved" | "completed"
      project_team_member_role: "admin" | "member" | "readonly"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
      workspace_invitation_link_status:
        | "active"
        | "finished_accepted"
        | "finished_declined"
        | "inactive"
      workspace_member_role_type: "owner" | "admin" | "member" | "readonly"
      workspace_membership_type: "solo" | "team"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
      device_status: [
        "pending",
        "in_progress",
        "waiting_parts",
        "completed",
        "delivered",
        "cancelled",
      ],
      incentive_type: [
        "customer_visit",
        "on_time_attendance",
        "holiday_work",
        "overtime",
        "monthly_target",
        "customer_registration",
      ],
      marketing_blog_post_status: ["draft", "published"],
      marketing_changelog_status: ["draft", "published"],
      marketing_feedback_moderator_hold_category: [
        "spam",
        "off_topic",
        "inappropriate",
        "other",
      ],
      marketing_feedback_reaction_type: [
        "like",
        "heart",
        "celebrate",
        "upvote",
      ],
      marketing_feedback_thread_priority: ["low", "medium", "high"],
      marketing_feedback_thread_status: [
        "open",
        "under_review",
        "planned",
        "closed",
        "in_progress",
        "completed",
        "moderator_hold",
      ],
      marketing_feedback_thread_type: ["bug", "feature_request", "general"],
      organization_joining_status: [
        "invited",
        "joinied",
        "declined_invitation",
        "joined",
      ],
      organization_member_role: ["owner", "admin", "member", "readonly"],
      pricing_plan_interval: ["day", "week", "month", "year"],
      pricing_type: ["one_time", "recurring"],
      project_status: ["draft", "pending_approval", "approved", "completed"],
      project_team_member_role: ["admin", "member", "readonly"],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
        "paused",
      ],
      workspace_invitation_link_status: [
        "active",
        "finished_accepted",
        "finished_declined",
        "inactive",
      ],
      workspace_member_role_type: ["owner", "admin", "member", "readonly"],
      workspace_membership_type: ["solo", "team"],
    },
  },
} as const
