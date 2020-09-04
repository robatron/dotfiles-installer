# .bashrc file for the e2e Docker test image

# Sync mounted dir
function sync {
    rsync -av --delete --progress /mnt/akinizer/ /home/robmc/ak/ --exclude node_modules/ --exclude .git
}
sync

# Load NVM
. ~/.nvm/nvm.sh

# Cd to akinizer dir
cd ~/ak
