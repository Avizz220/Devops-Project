output "db_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.mysql.endpoint
}

output "db_address" {
  description = "RDS address"
  value       = aws_db_instance.mysql.address
}

output "db_port" {
  description = "RDS port"
  value       = aws_db_instance.mysql.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.mysql.db_name
}

output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.mysql.id
}
