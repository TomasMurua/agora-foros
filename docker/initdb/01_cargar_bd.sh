#!/bin/bash
# Carga los scripts de bd/ en la PDB la primera vez que se crea el contenedor.
set -e
export NLS_LANG=AMERICAN_AMERICA.AL32UTF8

for script in /opt/agora/bd/*.sql; do
  echo "Ejecutando ${script}"
  sqlplus -s -L "system/${ORACLE_PASSWORD}@//localhost:1521/FREEPDB1" <<EOF
WHENEVER SQLERROR EXIT SQL.SQLCODE
@${script}
EXIT
EOF
done
