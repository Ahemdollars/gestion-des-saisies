@echo off
title Lancement - Gestion des Saisies Douanieres
echo [1/2] Demarrage des serveurs Docker...
docker-compose up -d
echo [2/2] Ouverture de l'application...
timeout /t 5 /nobreak > nul
start http://localhost:3000
echo ======================================================
echo SYSTEME OPERATIONNEL - DOUANES DU MALI
echo ======================================================
pause