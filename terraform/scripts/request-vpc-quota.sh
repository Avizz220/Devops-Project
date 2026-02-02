#!/bin/bash
# Request VPC quota increase in AWS

REGION="us-west-2"

echo "Requesting VPC quota increase for region: $REGION"
echo ""

aws service-quotas request-service-quota-increase \
    --service-code vpc \
    --quota-code L-F678F1CE \
    --desired-value 10 \
    --region $REGION

echo ""
echo "Quota increase requested. It may take a few hours to process."
echo "Check status: aws service-quotas get-requested-service-quota-change --request-id <REQUEST-ID> --region $REGION"
