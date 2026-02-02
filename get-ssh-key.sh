#!/bin/bash

##############################################################################
# GET SSH KEY FROM AWS SECRETS MANAGER OR PARAMETER STORE
# This script retrieves the SSH private key
##############################################################################

AWS_REGION="us-east-1"
KEY_NAME="community-events-key-prod"
OUTPUT_FILE="${KEY_NAME}.pem"

echo "Looking for SSH key in AWS..."

# Try AWS Secrets Manager first
echo "Checking AWS Secrets Manager..."
KEY_CONTENT=$(aws secretsmanager get-secret-value \
    --region $AWS_REGION \
    --secret-id "$KEY_NAME" \
    --query 'SecretString' \
    --output text 2>/dev/null)

if [ -n "$KEY_CONTENT" ]; then
    echo "$KEY_CONTENT" > "$OUTPUT_FILE"
    chmod 400 "$OUTPUT_FILE"
    echo "✓ SSH key retrieved from Secrets Manager and saved to $OUTPUT_FILE"
    exit 0
fi

# Try AWS Systems Manager Parameter Store
echo "Checking AWS Systems Manager Parameter Store..."
KEY_CONTENT=$(aws ssm get-parameter \
    --region $AWS_REGION \
    --name "/ec2/keypair/$KEY_NAME" \
    --with-decryption \
    --query 'Parameter.Value' \
    --output text 2>/dev/null)

if [ -n "$KEY_CONTENT" ]; then
    echo "$KEY_CONTENT" > "$OUTPUT_FILE"
    chmod 400 "$OUTPUT_FILE"
    echo "✓ SSH key retrieved from Parameter Store and saved to $OUTPUT_FILE"
    exit 0
fi

echo "✗ SSH key not found in AWS Secrets Manager or Parameter Store"
echo ""
echo "MANUAL STEPS REQUIRED:"
echo "1. Go to AWS Console → EC2 → Key Pairs"
echo "2. Find or create key pair: $KEY_NAME"
echo "3. Download the .pem file"
echo "4. Save it in this directory as: $OUTPUT_FILE"
echo "5. Run: chmod 400 $OUTPUT_FILE"
echo ""
echo "Alternatively, if you don't have the key, you can:"
echo "1. Create a new key pair in AWS"
echo "2. Update the instance to use the new key"
echo "3. Or use AWS Session Manager (no key needed):"
echo "   aws ssm start-session --region $AWS_REGION --target i-064119cb154739571"
