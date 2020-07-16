
# Docs
#   - https://zaiste.net/ssh_port_forwarding/
#   - http://linuxcommand.org/lc3_man_pages/ssh1.html
#   - https://help.ubuntu.com/community/SSH/OpenSSH/PortForwarding
#   - https://www.ericholscher.com/blog/2009/mar/21/really-easy-ssh-tunneling/
#   - VPN/Proxy
#     - https://help.ubuntu.com/community/SSH/OpenSSH/Advanced
#     - https://addons.mozilla.org/en-US/firefox/addon/switchyomega/
#
# SSH Tunnel options:
#   - ssh -L 8080:localhost:8080 ambari
#     - Opens a local SSH connection to ambari, with a tunnel which allows:
#     - firefox https:/localhost:8080
#   - ssh -L 9000:localhost:8080 ambari
#     - Same as above, but use port 9000 locally to connect to 8080 on the remote machine
#   - ssh -L 8080:localhost:8080 ambari -T
#     - same as above, but prevents opening a shell on the other end
#   - ssh -L localhost:8080:localhost:8080 ambari
#     - same as above, but adds a bind-address so only local apps can use the tunnel
#   - ssh -L localhost:8080:localhost:8080 ambari -nNTf
#     - same as above, but runs it propely in the bakckground
