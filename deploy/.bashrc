# .bashrc file that gets injected into the local Docker development container.
# See the README for details.

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

- Run `sync` to update the container repo with the host's repo
- Run `cd examples && gulp` to execute the example akinizer config
- The sudo password is: abc123


EOF
