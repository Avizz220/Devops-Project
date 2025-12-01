#!/bin/bash
cd ~/Devops_project/Devops_Project/terraform/modules/ec2

# Remove the Elastic IP resource block
sed -i '/# Elastic IPs for EC2 instances/,/^}/d' main.tf

echo 'Removed Elastic IP resource from EC2 module'
