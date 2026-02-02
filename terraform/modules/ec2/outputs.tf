output "instance_ids" {
  description = "EC2 instance IDs"
  value       = aws_instance.app[*].id
}

output "private_ips" {
  description = "EC2 private IP addresses"
  value       = aws_instance.app[*].private_ip
}

output "public_ips" {
  description = "EC2 public IP addresses"
  value       = aws_instance.app[*].public_ip
}

output "instance_profile_arn" {
  description = "IAM instance profile ARN"
  value       = aws_iam_instance_profile.ec2.arn
}
