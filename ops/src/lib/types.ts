// Extend NextAuth types
import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    userId?: string;
  }
}

// Email priority levels
export type EmailPriority = "critical" | "high" | "medium" | "low" | "none";

// Bill status
export type BillStatus = "pending" | "paid" | "overdue" | "disputed";

// AI categorization result
export interface AICategorization {
  entity: string;
  priority: EmailPriority;
  is_bill: boolean;
  needs_response: boolean;
  summary: string;
}

// Email account providers
export type EmailProvider = "gmail" | "outlook";

// Email rule condition types
export type RuleConditionType = "sender" | "domain" | "subject" | "keyword";

// Activity log action types
export type ActivityAction =
  | "email_archived"
  | "email_replied"
  | "email_blocked"
  | "email_reclassified"
  | "email_snoozed"
  | "bill_created"
  | "bill_paid"
  | "bill_updated"
  | "expense_created"
  | "expense_updated"
  | "revenue_created"
  | "rule_created"
  | "rule_updated"
  | "rule_deleted"
  | "sender_blocked"
  | "document_uploaded";

// Dashboard stats
export interface DashboardStats {
  unreadByEntity: Record<string, number>;
  actionRequired: number;
  billsDueThisWeek: number;
  billsDueAmount: number;
  expensesThisMonth: number;
  recentActivity: Array<{
    id: string;
    actionType: string;
    description: string;
    userName: string;
    createdAt: string;
  }>;
}
