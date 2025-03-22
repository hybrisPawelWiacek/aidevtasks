#!/bin/bash

# Script to run the application with all warning suppression options
export NODE_NO_WARNINGS=1
exec node --no-warnings node_modules/.bin/tsx server/index.ts