#!/bin/sh
# Construye las cuatro imágenes para linux/amd64 y las sube al Container Registry.
# Uso: deploy/publicar-imagenes.sh agoraforos.azurecr.io 2.0.0
# Antes: docker login <registry>  (en Azure: az acr login --name <registry>)
set -eu
REGISTRY=${1:?Indique el registry, por ejemplo agoraforos.azurecr.io}
TAG=${2:-2.0.0}
RAIZ=$(cd "$(dirname "$0")/.." && pwd)

for componente in ms-usuarios ms-foro ms-moderacion frontend; do
  imagen="$REGISTRY/agora-foros/$componente:$TAG"
  echo "==> $imagen"
  docker buildx build --platform linux/amd64 --provenance=false \
    -t "$imagen" -t "$REGISTRY/agora-foros/$componente:latest" \
    --push "$RAIZ/$componente"
done
