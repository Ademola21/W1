#!/bin/bash
# Stop PostgreSQL server
pg_ctl -D database/data stop
echo "PostgreSQL stopped"
