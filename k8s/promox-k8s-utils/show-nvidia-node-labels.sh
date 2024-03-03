kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.labels}{"\n"}{end}' | grep nvidi | awk '{print $2}' | jq .
