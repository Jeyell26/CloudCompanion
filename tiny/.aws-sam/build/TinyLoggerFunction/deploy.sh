#!/bin/bash
set -e

sam build

sam deploy --guided

echo $(deployed)
