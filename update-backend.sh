#!/bin/bash
docker pull avishka2002/community-events-backend:latest
docker-compose -f ~/app/docker-compose.yml up -d backend --force-recreate
