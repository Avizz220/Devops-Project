#!/bin/bash
cd ~/Devops_project/Devops_Project/terraform/modules/rds
sed -i 's/backup_retention_period = 7/backup_retention_period = 0/' main.tf
echo "Fixed backup retention period to 0"
