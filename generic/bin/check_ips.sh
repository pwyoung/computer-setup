for i in {5..9}; do echo $i; ssh d$i '/usr/sbin/ip a s | grep enp216s0f0 | grep global'; done

