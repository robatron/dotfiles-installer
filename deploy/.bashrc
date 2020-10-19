# .bashrc file for the e2e Docker test image

export AK_ROOT=$(cat ~/.akroot)

# Sync mounted dir
function sync () {
    rsync -av --delete --progress /mnt/akinizer/ $AK_ROOT --exclude node_modules/ --exclude .git
}
sync

# Load NVM
. ~/.nvm/nvm.sh

cd $AK_ROOT

cat <<-EOF


Welcome to the Akinizer development container!

- Run 'sync' to update the container repo with the host's repo
- The sudo password is: abc123


EOF
