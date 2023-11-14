
echo "This WILL DELETE RESOURCES"
read -p "Hit enter to continue (or ctrl-c to exit)"
aws-nuke -c ./aws-nuke-config.yml --no-dry-run


