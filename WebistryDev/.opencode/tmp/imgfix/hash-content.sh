#!/bin/bash
source /home/sherif/sites/Ahmed-Elakad/.env.local
echo -n "sha: "
psql "$DATABASE_URL" -t -A -c "select data from site_content where id = 'site'" | tr -d '\n' | sha256sum
echo -n "bytes: "
psql "$DATABASE_URL" -t -A -c "select length(data::text) from site_content where id = 'site'"
