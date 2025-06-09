resource "aws_budgets_budget" "monthly_budget" {
  name          = "team-monthly-budget"
  budget_type   = "COST"
  limit_amount  = "50" 
  limit_unit    = "USD"
  time_unit     = "MONTHLY"

  cost_types {
    include_credit         = true
    include_discount       = true
    include_other_subscription = true
    include_recurring      = true
    include_refund         = true
    include_tax            = true
    include_upfront        = true
    use_blended            = false
    use_amortized          = false
  }

  time_period_start = "2025-06-01_00:00"

  dynamic "notification" {
    for_each = toset(["50", "75"])
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = notification.value
      threshold_type             = "PERCENTAGE"
      notification_type          = "FORECASTED"
      subscriber_email_addresses = var.emails
    }
  }

  dynamic "notification" {
    for_each = toset(["10", "20", "30", "40", "60", "80", "90", "100"])
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = notification.value
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = var.emails
    }
  }
}