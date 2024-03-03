
for i in $(seq 1 5); do
    echo "$i"
    ssh "k-$i" 'sudo nmcli general reload dns-full'
done
