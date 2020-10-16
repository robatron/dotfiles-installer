# .bashrc file for the e2e Docker test image

# Sync mounted dir
function sync () {
    rsync -av --delete --progress /mnt/akinizer/ /home/robmc/ak/ --exclude node_modules/ --exclude .git
}
sync

# Load NVM
. ~/.nvm/nvm.sh

# Cd to akinizer dir
cd ~/ak

cat <<-EOF


Welcome to the Akinizer development container!

- Run 'sync' to update the container repo with the host's repo
- The sudo password is: abc123


EOF
