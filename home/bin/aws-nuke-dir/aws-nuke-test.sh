
LOG=./aws-nuke-test.log

echo "This does not run with --no-dry-run"
echo "so it will only show what it would delete"
./aws-nuke -c ./aws-nuke-config.yml &> $LOG


echo "################################################################################"
echo "Here's what would be removed"
echo "################################################################################"
cat $LOG | grep 'would remove'
