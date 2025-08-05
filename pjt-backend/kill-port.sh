#!/bin/bash
echo "Liberando porta 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pkill -f "node.*nest" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true
echo "Porta 3000 liberada!"