#!/bin/bash

# Script to run tests with the correct configuration

# Set Node options for ES modules
export NODE_OPTIONS="--experimental-vm-modules"

# Check if a specific test path was provided
if [ -z "$1" ]; then
  # Run all tests if no path specified
  echo "Running all tests..."
  npx jest
else
  # Run specific test path
  echo "Running tests at $1..."
  npx jest $1
fi