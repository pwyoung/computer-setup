
LOG=./aws-nuke-test.log

echo "This does not run with --no-dry-run"
echo "so it will NOT DELETE anything. "
echo "It willo nly show what it would delete"
./aws-nuke -c ./aws-nuke-config.yml 2>&1 | tee $LOG


echo "################################################################################"
echo "Here's what would be removed"
echo "################################################################################"
cat $LOG | grep 'would remove'
