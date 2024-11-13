docker buildx build -t ens-resolver --platform linux/amd64 .
docker tag ens-resolver us.gcr.io/likecoin-foundation/ens-resolver:latest
docker push us.gcr.io/likecoin-foundation/ens-resolver:latest